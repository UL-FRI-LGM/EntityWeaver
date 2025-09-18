import DataApi from "../api/data.ts";
import { createContext, use } from "react";
import { types, flow, isAlive, type Instance } from "mobx-state-tree";
import type Graph from "graphology";
import type Sigma from "sigma";

const Entity = types
  .model({
    id: types.string,
    name: types.string,
    type: types.string,
    document_id: types.string,
    group_id: types.maybe(types.string),
  })
  .views((self) => ({
    get globalId() {
      return `Entity-${self.id}`;
    },
  }));

export interface EntityInstance extends Instance<typeof Entity> {}

const Document = types
  .model({
    id: types.string,
    title: types.string,
  })
  .views((self) => ({
    get globalId() {
      return `Document-${self.id}`;
    },
  }));

export interface DocumentInstance extends Instance<typeof Document> {}

const EntityGroup = types
  .model({
    id: types.string,
    name: types.string,
    type: types.string,
  })
  .views((self) => ({
    get globalId() {
      return `EntityGroup-${self.id}`;
    },
  }));

export interface EntityGroupInstance extends Instance<typeof EntityGroup> {}

const Dataset = types
  .model({
    entities: types.array(Entity),
    documents: types.array(Document),
    entityGroups: types.array(EntityGroup),
  })
  .volatile(() => ({
    fetchingData: false,
  }))
  .actions((self) => ({
    afterCreate() {
      this.fetchData().catch((err) => console.error(err));
    },
    fetchData: flow(function* () {
      if (self.fetchingData) return;
      self.fetchingData = true;
      const data = yield DataApi.getData();
      if (!isAlive(self)) {
        return;
      }

      self.entities = data.entities;
      self.documents = data.documents;
      self.entityGroups = data.entity_groups;
      self.fetchingData = false;
    }),
  }));

export interface DatasetInstance extends Instance<typeof Dataset> {}

const RootStore = types
  .model({
    dataset: types.optional(Dataset, {}),
    isForceAtlasRunning: types.optional(types.boolean, false),
  })
  .volatile(() => ({
    graph: null as Graph | null,
    sigma: null as Sigma | null,
  }))
  .actions((self) => ({
    setIsForceAtlasRunning(state: boolean) {
      self.isForceAtlasRunning = state;
    },
    setGraph(graph: Graph) {
      self.graph = graph;
    },
    setSigma(sigma: Sigma) {
      self.sigma = sigma;
    },
  }));

const initialState = RootStore.create({});

export const rootStore = initialState;

export interface RootInstance extends Instance<typeof RootStore> {}

const RootStoreContext = createContext<null | RootInstance>(null);

export const RootStoreProvider = RootStoreContext.Provider;
export function useMst() {
  const store = use(RootStoreContext);
  if (store === null) {
    throw new Error("Store cannot be null, please add a context provider");
  }
  return store;
}
