import { createContext, use } from "react";
import { types, flow, isAlive, type Instance, getRoot } from "mobx-state-tree";
import type Sigma from "sigma";
import { updateMentionNode, updateGraph } from "../utils/graphHelpers.ts";
import { loadDemo } from "../utils/helpers.ts";

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
  entity_id: string;
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

export const Mention = types
  .model({
    id: types.string,
    name: types.string,
    type: types.string,
    document_id: types.string,
    entity_id: types.maybe(types.string),
  })
  .views((self) => ({
    get sigma(): Sigma<NodeType, EdgeType> | null {
      const rootStore = getRoot(self) as RootInstance;
      return rootStore.sigma;
    },
  }))
  .actions((self) => ({
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
    setDocumentId(documentId: string) {
      self.document_id = documentId;
      if (self.sigma) {
        updateMentionNode(self.sigma, self.id, { documentId: documentId });
      }
    },
    setEntityId(entityId: string | null) {
      self.entity_id = entityId ?? undefined;
    },
  }));

export interface MentionInstance extends Instance<typeof Mention> {}

export const Document = types.model({
  id: types.string,
  title: types.string,
});

export interface DocumentInstance extends Instance<typeof Document> {}

export const Entity = types
  .model({
    id: types.string,
    name: types.string,
    type: types.string,
  })
  .views((self) => ({
    get searchString() {
      return `${self.name} (${self.id})`;
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
      data.mentions.forEach((mention) => {
        mention.id = `${mentionPrefix}${mention.id}`;
        mention.document_id = `${documentPrefix}${mention.document_id}`;
        mention.entity_id = `${entityPrefix}${mention.entity_id}`;
        self.mentions.set(mention.id, mention);
      });

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
    runLayout: false,
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
