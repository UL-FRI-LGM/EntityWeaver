import {
  destroy,
  getRoot,
  type IAnyModelType,
  type Instance,
  types,
} from "mobx-state-tree";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import type Sigma from "sigma";
import type { EdgeType, NodeType, RootInstance } from "@/stores/rootStore.ts";
import { Mention, type MentionInstance } from "@/stores/mention.ts";

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
    mentions: types.map(
      types.safeReference(
        types.late((): IAnyModelType => Mention),
        { acceptsUndefined: false },
      ),
    ),
  })
  .views((self) => ({
    get sigma(): Sigma<NodeType, EdgeType> | null {
      const rootStore = getRoot(self) as RootInstance;
      return rootStore.sigma;
    },
    get canDelete(): boolean {
      return self.mentions.size === 0;
    },
    get mentionList(): MentionInstance[] {
      return Array.from(self.mentions.values());
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
    remove() {
      if (!self.canDelete) return;
      const rootStore = getRoot(self) as RootInstance;
      rootStore.onNodeDeleted(self.id);
      destroy(self);
    },
  }));

export interface DocumentInstance extends Instance<typeof Document> {}
