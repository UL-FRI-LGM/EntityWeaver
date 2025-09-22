import { type Instance, types } from "mobx-state-tree";
import { Mention } from "@/stores/mention.ts";

export const collocationPrefix = "Colocation-";
export interface CollocationDB {
  id: string;
  document_id: string;
  mentions: string[];
}

export const Collocation = types
  .model({
    id: types.identifier,
    mentions: types.map(types.reference(Mention)),
  })
  .views((self) => ({
    get mentionsList() {
      return Array.from(self.mentions.values());
    },
  }));

export interface CollocationInstance extends Instance<typeof Collocation> {}
