import { createContext, use } from "react";
import { types, flow, isAlive, type Instance, getRoot } from "mobx-state-tree";
import type Sigma from "sigma";
import { updateEntityNode, updateGraph } from "../utils/graphHelpers.ts";
import { loadDemo } from "../utils/helpers.ts";

export interface DatasetDB {
  entities: EntityDB[];
  entity_groups: GroupDB[];
  documents: DocumentDB[];
}

const entityPrefix = "Entity-";
interface EntityDB {
  id: string;
  name: string;
  type: string;
  document_id: string;
  group_id: string;
}

const documentPrefix = "Document-";
interface DocumentDB {
  id: string;
  title: string;
}

const groupPrefix = "Group-";
interface GroupDB {
  id: string;
  name: string;
  type: string;
}

export const Entity = types
  .model({
    id: types.string,
    name: types.string,
    type: types.string,
    document_id: types.string,
    group_id: types.maybe(types.string),
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
        updateEntityNode(self.sigma, self.id, { label: name });
      }
    },
    setType(type: string) {
      self.type = type;
      if (self.sigma) {
        updateEntityNode(self.sigma, self.id, { type: type });
      }
    },
    setDocumentId(documentId: string) {
      self.document_id = documentId;
      if (self.sigma) {
        updateEntityNode(self.sigma, self.id, { documentId: documentId });
      }
    },
    setGroupId(groupId: string | null) {
      self.group_id = groupId ?? undefined;
    },
  }));

export interface EntityInstance extends Instance<typeof Entity> {}

export const Document = types.model({
  id: types.string,
  title: types.string,
});
// .views((self) => ({
//   get globalId() {
//     return `Document-${self.id}`;
//   },
// }));

export interface DocumentInstance extends Instance<typeof Document> {}

export const EntityGroup = types
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
// .views((self) => ({
//   get globalId() {
//     return `EntityGroup-${self.id}`;
//   },
// }));

export interface EntityGroupInstance extends Instance<typeof EntityGroup> {}

const Dataset = types
  .model({
    entities: types.map(Entity),
    documents: types.map(Document),
    entityGroups: types.map(EntityGroup),
  })
  .volatile(() => ({
    fetchingData: false,
  }))
  .views((self) => ({
    get entityList() {
      return Array.from(self.entities.values());
    },
    get documentList() {
      return Array.from(self.documents.values());
    },
    get groupList() {
      return Array.from(self.entityGroups.values());
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

      self.entities.clear();
      data.entities.forEach((entity) => {
        entity.id = `${entityPrefix}${entity.id}`;
        entity.document_id = `${documentPrefix}${entity.document_id}`;
        entity.group_id = `${groupPrefix}${entity.group_id}`;
        self.entities.set(entity.id, entity);
      });

      self.documents.clear();
      data.documents.forEach((document) => {
        document.id = `${documentPrefix}${document.id}`;
        self.documents.set(document.id, document);
      });

      self.entityGroups.clear();
      data.entity_groups.forEach((group) => {
        group.id = `${groupPrefix}${group.id}`;
        self.entityGroups.set(group.id, group);
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
  connectionType: "Document" | "Group";
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
      if (self.selectedNode.startsWith(entityPrefix)) {
        return self.dataset.entities.get(self.selectedNode);
      } else if (self.selectedNode.startsWith(documentPrefix)) {
        return self.dataset.documents.get(self.selectedNode);
      } else if (self.selectedNode.startsWith(groupPrefix)) {
        return self.dataset.entityGroups.get(self.selectedNode);
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
