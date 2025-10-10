import { DEFINES } from "@/defines.ts";
import { GraphEntity } from "@/stores/graphEntity.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { computed, makeObservable, override } from "mobx";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import type { Mention } from "@/stores/mention.ts";

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

  private _name: string;
  type: string;
  mentions: Map<string, Mention> = new Map<string, Mention>();

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

    makeObservable<Entity, "_name">(this, {
      _name: true,
      name: true,
      type: true,
      searchString: true,
      mentionList: computed({ keepAlive: true }),
      canDelete: override,

      onMentionLinked: true,
      onMentionUnlinked: true,
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

  get mentionList() {
    return Array.from(this.mentions.values());
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

  onMentionLinked(mention: Mention) {
    this.mentions.set(mention.id, mention);
  }

  onMentionUnlinked(mention: Mention) {
    this.mentions.delete(mention.id);
  }
}
