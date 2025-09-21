import { type Instance, types } from "mobx-state-tree";

export const documentPrefix = "Document-";
export interface DocumentDB {
  id: string;
  title: string;
}

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
