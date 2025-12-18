import { GraphEntity } from "@/stores/graphEntity.ts";
import { computed, makeObservable, override } from "mobx";
import type { Dataset } from "@/stores/dataset.ts";
import { updateMentionNode } from "@/utils/graphHelpers.ts";
import { Document } from "@/stores/document.ts";
import { Entity } from "@/stores/entity.ts";
import { DEFINES } from "@/defines.ts";
import { EntityLink } from "@/stores/entityLink.ts";
import type { MentionDB, NodeAttributes } from "@/utils/schemas.ts";

export interface UncertainEntity {
  entity: Entity;
  confidence: number;
}

export class Mention extends GraphEntity {
  static prefix = "Mention-";

  start_index: number;
  end_index: number;

  entityLinks: Map<string, EntityLink> = new Map<string, EntityLink>();

  document: Document;

  constructor(
    internal_id: string,
    start_index: number,
    end_index: number,
    document: Document,
    dataset: Dataset,
    entities: (Entity | UncertainEntity)[] = [],
    attributes?: NodeAttributes,
    x?: number,
    y?: number,
  ) {
    super(internal_id, Mention.prefix, dataset, x, y, "Mention", attributes);
    this.start_index = start_index;
    this.end_index = end_index;
    this.document = document;

    entities.forEach((entity) => {
      this.setEntityLink(entity, true, false);
    });

    this.document.mentions.set(this.id, this);

    makeObservable<Mention>(this, {
      name: computed({ keepAlive: true }),
      type: true,
      start_index: true,
      end_index: true,
      entityLinks: true,
      document: true,

      color: computed({ keepAlive: true }),

      entityLinkList: computed({ keepAlive: true }),
      setName: true,
      setType: true,
      setDocument: true,
      setIndices: true,

      dispose: override,

      onEntityUnlinked: true,
      setEntityLink: true,

      contextSnippet: computed,
    });
  }

  get type() {
    return "type" in this.attributes ? (this.attributes.type as string) : "";
  }

  get color() {
    return this.dataset.attributeManager.mentionProperties.getColorForNode(
      this,
    );
  }

  getReservedAttributes(): NodeAttributes {
    return {
      name: this.name,
    };
  }

  static fromJson(data: MentionDB, dataset: Dataset): Mention {
    const documentId = Document.prefix + data.document_id;
    const document = dataset.documents.get(documentId);
    if (!document) {
      throw new Error(
        `Document with id ${data.document_id} not found for Mention ${data.id}`,
      );
    }
    const entities: UncertainEntity[] = [];
    data.links.forEach((link) => {
      const entityId = Entity.prefix + link.entity_id;
      const entity = dataset.entities.get(entityId);
      if (entity) {
        entities.push({ entity: entity, confidence: link.confidence });
      } else {
        console.warn(
          `Entity with id ${link.entity_id} not found for Mention ${data.id}`,
        );
      }
    });
    return new Mention(
      data.id,
      data.start_index,
      data.end_index,
      document,
      dataset,
      entities,
      data.attributes,
      data.x,
      data.y,
    );
  }

  toJson(): MentionDB {
    return {
      id: this.internal_id,
      start_index: this.start_index,
      end_index: this.end_index,
      document_id: this.document.internal_id,
      links: this.entityLinkList.map((entityLink) => ({
        entity_id: entityLink.entity.internal_id,
        confidence: entityLink.confidence,
      })),
      x: this.x,
      y: this.y,
      attributes: this.attributes,
    };
  }

  get entityLinkList() {
    return Array.from(this.entityLinks.values());
  }

  get name() {
    return this.document.text.slice(this.start_index, this.end_index);
  }

  setName(name: string) {
    this.document.editText(this.start_index, this.end_index, name);
  }

  setType(type: string) {
    this.attributes.type = type;
    if (this.dataset.appState.sigma) {
      updateMentionNode(this.dataset.appState.sigma, this.id, { type: type });
    }
  }
  setDocument(document: Document) {
    this.document = document;
    if (this.dataset.appState.sigma) {
      updateMentionNode(this.dataset.appState.sigma, this.id, {
        documentId: document.id,
      });
    }
  }

  setIndices(startIndex: number, endIndex: number) {
    this.start_index = startIndex;
    this.end_index = endIndex;
    if (this.dataset.appState.sigma) {
      updateMentionNode(this.dataset.appState.sigma, this.id, {
        label: this.name,
      });
    }
  }

  override dispose() {
    if (!this.canDelete) return;

    super.dispose();
    this.document.mentions.delete(this.id);
    this.entityLinkList.forEach((link) => {
      link.delete(false);
    });
    return;
  }

  onEntityLinked(entityLink: EntityLink, updateGraph = true) {
    this.entityLinks.set(entityLink.entity.id, entityLink);
    if (updateGraph && this.dataset.appState.sigma) {
      updateMentionNode(this.dataset.appState.sigma, this.id, {
        addedEntityLinks: [entityLink],
      });
    }
  }

  onEntityUnlinked(entityId: string, updateGraph = true) {
    this.entityLinks.delete(entityId);
    if (updateGraph && this.dataset.appState.sigma) {
      updateMentionNode(this.dataset.appState.sigma, this.id, {
        removedEntityLinks: [entityId],
      });
    }
  }

  setEntityLink(
    entity: Entity | UncertainEntity | string,
    keepExisting = true,
    updateGraph = true,
  ) {
    let newEntityLink: UncertainEntity;
    if (typeof entity === "string") {
      const foundEntity = this.dataset.entities.get(entity);
      if (!foundEntity) {
        console.warn(`Entity with id ${entity} not found`);
        return;
      }
      newEntityLink = { entity: foundEntity, confidence: 1 };
    } else {
      newEntityLink =
        entity instanceof Entity ? { entity: entity, confidence: 1 } : entity;
    }
    let entityLink = this.entityLinks.get(newEntityLink.entity.id);
    if (keepExisting && entityLink) {
      return;
    }
    if (!keepExisting) {
      this.entityLinks.forEach((link) => {
        if (!entityLink || link.entity.id !== newEntityLink.entity.id) {
          link.delete(false);
        }
      });
    }
    if (!entityLink) {
      entityLink = new EntityLink(
        newEntityLink.entity,
        this,
        newEntityLink.confidence,
        false,
      );
    }
    if (updateGraph && this.dataset.appState.sigma) {
      updateMentionNode(this.dataset.appState.sigma, this.id, {
        addedEntityLinks: [entityLink],
        clearEntityLinks: !keepExisting,
      });
    }
  }

  get contextSnippet() {
    const docText = this.document.text;

    let start = Math.max(0, this.start_index - DEFINES.contextWindow);
    let end = Math.min(docText.length, this.end_index + DEFINES.contextWindow);

    while (start > 0 && !/\s/.test(docText[start])) {
      start--;
    }

    while (end < docText.length - 1 && !/\w/.test(docText[end])) {
      end++;
    }

    const prefix = start > 0 ? "..." : "";
    const suffix = end < docText.length ? "..." : "";

    return {
      before: prefix + docText.slice(start, this.start_index),
      mention: docText.slice(this.start_index, this.end_index),
      after: docText.slice(this.end_index, end) + suffix,
      // context: prefix + docText.slice(start, end) + suffix,
      // start: newStart,
      // end: newEnd,
    };
  }
}
