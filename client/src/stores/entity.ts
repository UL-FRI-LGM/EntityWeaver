import { DEFINES } from "@/defines.ts";
import { GraphEntity } from "@/stores/graphEntity.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { computed, makeObservable, override } from "mobx";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import type { EntityLink } from "@/stores/entityLink.ts";
import type { AttributeValuesType, EntitySchema } from "@/utils/schemas.ts";
import { z } from "zod";

export type EntityTypes = keyof typeof DEFINES.entityTypes.names;

export type EntityDB = z.output<typeof EntitySchema>;

export class Entity extends GraphEntity {
  static prefix = "Entity-";

  mentionLinks: Map<string, EntityLink> = new Map<string, EntityLink>();

  constructor(
    internal_id: string,
    dataset: Dataset,
    x?: number,
    y?: number,
    attributes?: Record<string, AttributeValuesType>,
  ) {
    super(internal_id, Entity.prefix, dataset, x, y, "Entity", attributes);

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
    return new Entity(data.id, dataset, data.x, data.y, data.attributes);
  }

  toJson(): EntityDB {
    return {
      id: this.internal_id,
      x: this.x,
      y: this.y,
      attributes: this.attributesToJson(),
    };
  }

  get name(): string {
    return (this.attributes.get("name") as string | undefined) ?? "";
  }

  get type(): string {
    return (this.attributes.get("type") as string | undefined) ?? "";
  }

  get mentionLinkList() {
    return Array.from(this.mentionLinks.values());
  }

  setName(name: string) {
    this.attributes.set("name", name);
    updateNodeProperties(this.dataset.appState.sigma, this.id, { label: name });
  }

  setType(type: string) {
    this.attributes.set("type", type);
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
