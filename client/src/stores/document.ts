import { getRoot, type Instance, types } from "mobx-state-tree";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import type Sigma from "sigma";
import type { EdgeType, NodeType, RootInstance } from "@/stores/rootStore.ts";

export const documentPrefix = "Document-";
export interface DocumentDB {
  id: string;
  title: string;
}

export const Document = types
  .model({
    id: types.identifier,
    x: types.maybe(types.number),
    y: types.maybe(types.number),
    title: types.string,
  })
  .views((self) => ({
    get sigma(): Sigma<NodeType, EdgeType> | null {
      const rootStore = getRoot(self) as RootInstance;
      return rootStore.sigma;
    },
  }))
  .actions((self) => ({
    setTitle(title: string) {
      self.title = title;
    },
    setPosition(position: { x?: number | null; y?: number | null }) {
      self.x = position.x ?? undefined;
      self.y = position.y ?? undefined;
      if (self.x !== null || self.y !== null) {
        updateNodeProperties(self.sigma, self.id, { x: self.x, y: self.y });
      }
    },
  }));

export interface DocumentInstance extends Instance<typeof Document> {}
