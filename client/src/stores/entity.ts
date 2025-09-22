import { getRoot, type Instance, types } from "mobx-state-tree";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import type Sigma from "sigma";
import type { EdgeType, NodeType, RootInstance } from "@/stores/rootStore.ts";
import { DEFINES } from "@/defines.ts";

export type EntityTypes = keyof typeof DEFINES.entityTypes.names;

export const entityPrefix = "Entity-";
export interface EntityDB {
  id: string;
  name: string;
  type: string;
}

export const Entity = types
  .model({
    id: types.identifier,
    x: types.maybe(types.number),
    y: types.maybe(types.number),
    name: types.string,
    type: types.string,
  })
  .views((self) => ({
    get searchString() {
      return `${self.name} (${self.id})`;
    },
    get sigma(): Sigma<NodeType, EdgeType> | null {
      const rootStore = getRoot(self) as RootInstance;
      return rootStore.sigma;
    },
  }))
  .actions((self) => ({
    setName(name: string) {
      self.name = name;
    },
    setType(type: string) {
      self.type = type;
    },
    setPosition(position: { x?: number | null; y?: number | null }) {
      self.x = position.x ?? undefined;
      self.y = position.y ?? undefined;
      if (self.x !== null || self.y !== null) {
        updateNodeProperties(self.sigma, self.id, { x: self.x, y: self.y });
      }
    },
  }));

export interface EntityInstance extends Instance<typeof Entity> {}
