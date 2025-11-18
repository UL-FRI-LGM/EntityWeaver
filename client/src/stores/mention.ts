import { GraphEntity } from "@/stores/graphEntity.ts";
import { computed, makeObservable } from "mobx";
import type { Dataset } from "@/stores/dataset.ts";
import { updateMentionNode } from "@/utils/graphHelpers.ts";
import { Document } from "@/stores/document.ts";
import { Entity } from "@/stores/entity.ts";
import { DEFINES } from "@/defines.ts";

export interface MentionDB {
  id: string;
  type: string;
  start_index: number;
  end_index: number;
  document_id: string;
  links: {
    entity_id: string;
  }[];
  x?: number;
  y?: number;
}

export class Mention extends GraphEntity {
  static prefix = "Mention-";

  type: string;
  start_index: number;
  end_index: number;

  entities: Map<string, Entity> = new Map<string, Entity>();

  document: Document;

  constructor(
    internal_id: string,
    type: string,
    start_index: number,
    end_index: number,
    document: Document,
    dataset: Dataset,
    entities: Entity[] = [],
    x?: number,
    y?: number,
  ) {
    super(internal_id, Mention.prefix, dataset, x, y);
    this.type = type;
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
      entities: true,
      document: true,

      entityLinkList: computed({ keepAlive: true }),
      setName: true,
      setType: true,
      setDocument: true,
      setIndices: true,

      removeEntityLink: true,
      setEntityLink: true,

      contextSnippet: computed,
    });
  }

  static fromJson(data: MentionDB, dataset: Dataset): Mention {
    const documentId = Document.prefix + data.document_id;
    const document = dataset.documents.get(documentId);
    if (!document) {
      throw new Error(
        `Document with id ${data.document_id} not found for Mention ${data.id}`,
      );
    }
    const entities: Entity[] = [];
    data.links.forEach((link) => {
      const entityId = Entity.prefix + link.entity_id;
      const entity = dataset.entities.get(entityId);
      if (entity) {
        entities.push(entity);
      } else {
        console.warn(
          `Entity with id ${link.entity_id} not found for Mention ${data.id}`,
        );
      }
    });
    return new Mention(
      data.id,
      data.type,
      data.start_index,
      data.end_index,
      document,
      dataset,
      entities,
      data.x,
      data.y,
    );
  }

  toJson(): MentionDB {
    return {
      id: this.internal_id,
      type: this.type,
      start_index: this.start_index,
      end_index: this.end_index,
      document_id: this.document.internal_id,
      links: this.entityLinkList.map((entity) => ({
        entity_id: entity.internal_id,
      })),
      x: this.x,
      y: this.y,
    };
  }

  get entityLinkList() {
    return Array.from(this.entities.values());
  }

  get name() {
    return this.document.text.slice(this.start_index, this.end_index);
  }

  setName(name: string) {
    this.document.editText(this.start_index, this.end_index, name);
  }

  setType(type: string) {
    this.type = type;
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

  removeEntityLink(entityId: string) {
    this.entities.delete(entityId);
    const entity = this.dataset.entities.get(entityId);
    if (entity) {
      entity.onMentionUnlinked(this);
    }
    if (this.dataset.appState.sigma) {
      updateMentionNode(this.dataset.appState.sigma, this.id, {
        removedEntityLinks: [entityId],
      });
    }
  }
  setEntityLink(
    entity: Entity | string,
    keepExisting = true,
    updateGraph = true,
  ) {
    let linkedEntity: Entity;
    if (typeof entity === "string") {
      const foundEntity = this.dataset.entities.get(entity);
      if (!foundEntity) {
        console.warn(`Entity with id ${entity} not found`);
        return;
      }
      linkedEntity = foundEntity;
    } else {
      linkedEntity = entity;
    }
    const alreadyHasLink = this.entities.has(linkedEntity.id);
    if (keepExisting && alreadyHasLink) {
      return;
    }
    if (!keepExisting) {
      if (!alreadyHasLink) {
        this.entities.clear();
      } else {
        this.entities.forEach((link) => {
          if (link.id !== linkedEntity.id) {
            this.entities.delete(link.id);
          }
        });
      }
    }
    if (!alreadyHasLink) {
      this.entities.set(linkedEntity.id, linkedEntity);
      linkedEntity.onMentionLinked(this);
    }
    if (updateGraph && this.dataset.appState.sigma) {
      updateMentionNode(this.dataset.appState.sigma, this.id, {
        addedEntityLinks: [linkedEntity.id],
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
