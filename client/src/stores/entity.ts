import { DEFINES } from "@/defines.ts";
import { GraphEntity } from "@/stores/graphEntity.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { makeObservable, override } from "mobx";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";

export type EntityTypes = keyof typeof DEFINES.entityTypes.names;

export interface EntityDB {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
}

export class Entity extends GraphEntity {
  static prefix = "Entity-";

  _name: string;
  type: string;

  constructor(
    internal_id: string,
    name: string,
    type: string,
    dataset: Dataset,
    x?: number,
    y?: number,
  ) {
    super(internal_id, Entity.prefix, dataset, x, y);
    this._name = name;
    this.type = type;

    makeObservable(this, {
      _name: true,
      name: true,
      type: true,
      searchString: true,
      canDelete: override,
    });
  }

  static fromJson(data: EntityDB, dataset: Dataset): Entity {
    return new Entity(data.id, data.name, data.type, dataset, data.x, data.y);
  }

  toJson(): EntityDB {
    return {
      id: this.internal_id,
      name: this.name,
      type: this.type,
      x: this.x,
      y: this.y,
    };
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
    updateNodeProperties(this.dataset.appState.sigma, this.id, { label: name });
  }

  get searchString() {
    return `${this.name} (${this.internal_id})`;
  }
}
