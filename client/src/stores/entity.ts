import { GraphEntity } from "@/stores/graphEntity.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { computed, makeObservable, override } from "mobx";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import type { EntityLink } from "@/stores/entityLink.ts";
import { type EntityDB, type NodeAttributes } from "@/utils/schemas.ts";

export class Entity extends GraphEntity {
  static prefix = "Entity-";

  mentionLinks: Map<string, EntityLink> = new Map<string, EntityLink>();

  // Reserved attributes
  name: string;

  constructor(
    internal_id: string,
    name: string,
    dataset: Dataset,
    attributes?: NodeAttributes,
    x?: number,
    y?: number,
  ) {
    super(internal_id, Entity.prefix, dataset, x, y, "Entity", attributes);

    this.name = name;

    makeObservable(this, {
      name: true,
      type: true,
      setName: true,
      setType: true,

      color: computed({ keepAlive: true }),

      searchString: true,
      mentionLinkList: computed({ keepAlive: true }),
      dispose: override,

      onMentionLinked: true,
      onMentionUnlinked: true,
    });
  }

  static fromJson(data: EntityDB, dataset: Dataset): Entity {
    return new Entity(
      data.id,
      data.name,
      dataset,
      data.attributes,
      data.x,
      data.y,
    );
  }

  toJson(): EntityDB {
    return {
      id: this.internal_id,
      name: this.name,
      x: this.x,
      y: this.y,
      attributes: this.attributes,
    };
  }

  get type(): string {
    return "type" in this.attributes ? (this.attributes.type as string) : "";
  }

  get color() {
    return this.dataset.attributeManager.entityProperties.getColorForNode(this);
  }

  getReservedAttributes(): NodeAttributes {
    return {
      name: this.name,
    };
  }

  get mentionLinkList() {
    return Array.from(this.mentionLinks.values());
  }

  setName(name: string) {
    this.attributes.name = name;
    updateNodeProperties(this.dataset.appState.sigma, this.id, { label: name });
  }

  setType(type: string) {
    this.attributes.type = type;
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
