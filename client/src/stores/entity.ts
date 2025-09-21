import { type Instance, types } from "mobx-state-tree";

export const entityPrefix = "Entity-";
export interface EntityDB {
  id: string;
  name: string;
  type: string;
}

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
