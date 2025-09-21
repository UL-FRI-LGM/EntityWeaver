import { createContext, use } from "react";
import {
  types,
  flow,
  isAlive,
  type Instance,
  getRoot,
  getParentOfType,
} from "mobx-state-tree";
import type Sigma from "sigma";
import { updateMentionNode, updateGraph } from "@/utils/graphHelpers.ts";
import { loadDemo } from "@/utils/helpers.ts";
import type { AnimateOptions } from "sigma/utils";

export interface DatasetDB {
  mentions: MentionDB[];
  entities: EntityDB[];
  documents: DocumentDB[];
}

const mentionPrefix = "Mention-";
interface MentionDB {
  id: string;
  name: string;
  type: string;
  document_id: string;
  links: {
    entity_id: string;
  }[];
}

const documentPrefix = "Document-";
interface DocumentDB {
  id: string;
  title: string;
}

const entityPrefix = "Entity-";
interface EntityDB {
  id: string;
  name: string;
  type: string;
}

export const Link = types
  .model({
    entity: types.reference(types.late(() => Entity)),
  })
  .actions((self) => ({
    remove() {
      const mention = getParentOfType(self, Mention) as MentionInstance;
      mention?.removeEntityLink(self.entity.id);
    },
  }));

export interface LinkInstance extends Instance<typeof Link> {}

export const Mention = types
  .model({
    id: types.identifier,
    name: types.string,
    type: types.string,
    document: types.reference(types.late(() => Document)),
    entityLinks: types.map(Link),
  })
  .views((self) => ({
    get sigma(): Sigma<NodeType, EdgeType> | null {
      const rootStore = getRoot(self) as RootInstance;
      return rootStore.sigma;
    },
    get entityLinkList() {
      return Array.from(self.entityLinks.values());
    },
  }))
  .actions((self) => {
    return {
      setName(name: string) {
        self.name = name;
        if (self.sigma) {
          updateMentionNode(self.sigma, self.id, { label: name });
        }
      },
      setType(type: string) {
        self.type = type;
        if (self.sigma) {
          updateMentionNode(self.sigma, self.id, { type: type });
        }
      },
      setDocumentId(document: DocumentInstance) {
        self.document = document;
        if (self.sigma) {
          updateMentionNode(self.sigma, self.id, { documentId: document.id });
        }
      },
      removeEntityLink(entityId: string) {
        self.entityLinks.delete(entityId);
        if (self.sigma) {
          updateMentionNode(self.sigma, self.id, {
            removedEntityLinks: [entityId],
          });
        }
      },
      setEntityLink(entityId: string, keepExisting = true) {
        const alreadyHasLink = self.entityLinks.has(entityId);
        if (keepExisting && alreadyHasLink) {
          return;
        }
        if (!keepExisting) {
          if (!alreadyHasLink) {
            self.entityLinks.clear();
          } else {
            self.entityLinks.forEach((link) => {
              if (link.entity.id !== entityId) {
                self.entityLinks.delete(link.entity.id);
              }
            });
          }
        }
        if (!alreadyHasLink) {
          self.entityLinks.set(entityId, { entity: entityId });
        }
        if (self.sigma) {
          updateMentionNode(self.sigma, self.id, {
            addedEntityLinks: [entityId],
            clearEntityLinks: !keepExisting,
          });
        }
      },
    };
  });

export interface MentionInstance extends Instance<typeof Mention> {}

export const Document = types
  .model({
    id: types.identifier,
    title: types.string,
  })
  .actions((self) => ({
    setTitle(title: string) {
      self.title = title;
    },
  }));

export interface DocumentInstance extends Instance<typeof Document> {}

export const Entity = types
  .model({
    id: types.identifier,
    name: types.string,
    type: types.string,
  })
  .views((self) => ({
    get searchString() {
      return `${self.name} (${self.id})`;
    },
  }))
  .actions((self) => ({
    setName(name: string) {
      self.name = name;
    },
    setType(type: string) {
      self.type = type;
    },
  }));

export interface EntityInstance extends Instance<typeof Entity> {}

const Dataset = types
  .model({
    mentions: types.map(Mention),
    documents: types.map(Document),
    entities: types.map(Entity),
  })
  .volatile(() => ({
    fetchingData: false,
  }))
  .views((self) => ({
    get mentionList() {
      return Array.from(self.mentions.values());
    },
    get documentList() {
      return Array.from(self.documents.values());
    },
    get entityList() {
      return Array.from(self.entities.values());
    },
  }))
  .actions((self) => ({
    afterCreate() {
      this.fetchData().catch((err) => console.error(err));
    },
    fetchData: flow(function* () {
      if (self.fetchingData) return;
      self.fetchingData = true;
      const data: DatasetDB = yield loadDemo();
      if (!isAlive(self)) {
        return;
      }

      self.mentions.clear();

      self.documents.clear();
      data.documents.forEach((document) => {
        document.id = `${documentPrefix}${document.id}`;
        self.documents.set(document.id, document);
      });

      self.entities.clear();
      data.entities.forEach((entity) => {
        entity.id = `${entityPrefix}${entity.id}`;
        self.entities.set(entity.id, entity);
      });

      data.mentions.forEach((mention) => {
        mention.id = `${mentionPrefix}${mention.id}`;
        mention.document_id = `${documentPrefix}${mention.document_id}`;
        self.mentions.set(mention.id, {
          id: mention.id,
          name: mention.name,
          type: mention.type,
          document: mention.document_id,
          entityLinks: Object.fromEntries(
            mention.links.map((link) => {
              link.entity_id = `${entityPrefix}${link.entity_id}`;
              const linkedEntity = self.entities.get(link.entity_id);
              if (!linkedEntity) {
                throw new Error(`Entity with id ${link.entity_id} not found`);
              }
              return [linkedEntity.id, { entity: linkedEntity }];
            }),
          ),
        });
      });

      self.fetchingData = false;

      const rootStore = getRoot<RootInstance>(self);
      rootStore?.onDatasetUpdate();
    }),
  }));

export interface DatasetInstance extends Instance<typeof Dataset> {}

export interface NodeType {
  x: number;
  y: number;
  label: string;
  size: number;
  color: string;
  highlighted?: boolean;
  borderColor?: string;
  borderSize?: number;
  image: string;
  pictogramColor: string;
  type: string;
}
export interface EdgeType {
  size: number;
  color: string;
  connectionType: "Document" | "Entity";
}

const RootStore = types
  .model({
    dataset: types.optional(Dataset, {}),
    isForceAtlasRunning: types.optional(types.boolean, false),
  })
  .volatile(() => ({
    sigma: null as Sigma<NodeType, EdgeType> | null,
    selectedNode: null as string | null,
    hoveredNode: null as string | null,
    uiHoveredNode: null as string | null,
    runLayout: false,
    holdingShift: false,
    highlightOnSelect: true,
    highlightOnHover: true,
  }))
  .views((self) => ({
    get selectedNodeInstance() {
      if (!self.selectedNode) return null;
      if (self.selectedNode.startsWith(mentionPrefix)) {
        return self.dataset.mentions.get(self.selectedNode);
      } else if (self.selectedNode.startsWith(documentPrefix)) {
        return self.dataset.documents.get(self.selectedNode);
      } else if (self.selectedNode.startsWith(entityPrefix)) {
        return self.dataset.entities.get(self.selectedNode);
      } else {
        return null;
      }
    },
  }))
  .actions((self) => ({
    setIsForceAtlasRunning(state: boolean) {
      self.isForceAtlasRunning = state;
    },
    setSigma(sigma: Sigma<NodeType, EdgeType>) {
      self.sigma = sigma;
      this.runGraphUpdate();
    },
    setSelectedNode(nodeId: string | null) {
      self.selectedNode = nodeId;
    },
    setHoveredNode(nodeId: string | null) {
      self.hoveredNode = nodeId;
    },
    onDatasetUpdate() {
      this.runGraphUpdate();
    },
    runGraphUpdate() {
      if (self.sigma && !self.dataset.fetchingData) {
        updateGraph(self.sigma, self.dataset);
        self.runLayout = true;
      }
    },
    setRunLayout(state: boolean) {
      self.runLayout = state;
    },
    setHoldingShift(state: boolean) {
      self.holdingShift = state;
    },
    setHighlightOnSelect(state: boolean) {
      self.highlightOnSelect = state;
    },
    setHighlightOnHover(state: boolean) {
      self.highlightOnHover = state;
    },
    setUiHoveredNode(nodeId: string | null) {
      self.uiHoveredNode = nodeId;
    },
    onFinishRenderingLayout() {
      // const cameraState = self.sigma?.getCamera().getState();
      // if (!cameraState) return;
      // if (
      //   cameraState.x === 0.5 &&
      //   cameraState.y === 0.5 &&
      //   cameraState.ratio === 1
      // ) {
      //   this.resetCamera();
      // }
    },
    resetCamera(options: Partial<AnimateOptions> = { duration: 1 }) {
      const camera = self.sigma?.getCamera();
      camera?.animatedReset(options).catch(console.error);
    },
  }));

export interface RootInstance extends Instance<typeof RootStore> {}

const initialState = RootStore.create({});

export const rootStore = initialState;

const RootStoreContext = createContext<null | RootInstance>(null);

export const RootStoreProvider = RootStoreContext.Provider;
export function useMst() {
  const store = use(RootStoreContext);
  if (store === null) {
    throw new Error("Store cannot be null, please add a context provider");
  }
  return store;
}
