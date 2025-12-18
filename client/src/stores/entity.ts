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
      setName: true,

      color: computed({ keepAlive: true }),

      reservedAttributes: override,

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

  get color() {
    return this.dataset.attributeManager.entityProperties.getColorForNode(this);
  }

  get reservedAttributes(): NodeAttributes {
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
