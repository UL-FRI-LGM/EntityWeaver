import { DEFINES } from "@/defines.ts";
import { GraphEntity } from "@/stores/graphEntity.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { computed, makeObservable, override } from "mobx";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import type { EntityLink } from "@/stores/entityLink.ts";

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

  name: string;
  type: string;
  mentionLinks: Map<string, EntityLink> = new Map<string, EntityLink>();

  constructor(
    internal_id: string,
    name: string,
    type: string,
    dataset: Dataset,
    x?: number,
    y?: number,
  ) {
    super(internal_id, Entity.prefix, dataset, x, y);
    this.name = name;
    this.type = type;

    makeObservable(this, {
      name: true,
      type: true,
      setName: true,
      setType: true,

      searchString: true,
      mentionLinkList: computed({ keepAlive: true }),
      dispose: override,

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

  get mentionLinkList() {
    return Array.from(this.mentionLinks.values());
  }

  setName(name: string) {
    this.name = name;
    updateNodeProperties(this.dataset.appState.sigma, this.id, { label: name });
  }

  setType(type: string) {
    this.type = type;
    updateNodeProperties(this.dataset.appState.sigma, this.id, { type: type });
  }

  get searchString() {
    return `${this.name} (${this.internal_id})`;
  }

  onMentionLinked(entityLink: EntityLink) {
    this.mentionLinks.set(entityLink.mention.id, entityLink);
  }

  onMentionUnlinked(mentionId: string) {
    this.mentionLinks.delete(mentionId);
  }

  override dispose() {
    if (!this.canDelete) return;

    this.mentionLinks.forEach((mentionLink) => {
      mentionLink.delete(false);
    });

    super.dispose();
  }
}
