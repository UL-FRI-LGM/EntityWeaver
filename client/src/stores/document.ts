import { GraphEntity } from "@/stores/graphEntity.ts";
import type { Mention } from "@/stores/mention.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { computed, makeObservable, observable, override } from "mobx";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";

export interface DocumentDB {
  id: string;
  title: string;
  x?: number;
  y?: number;
}

export class Document extends GraphEntity {
  static prefix = "Document-";

  title: string;
  mentions: Map<string, Mention> = new Map<string, Mention>();

  constructor(
    internal_id: string,
    title: string,
    dataset: Dataset,
    x?: number,
    y?: number,
  ) {
    super(internal_id, Document.prefix, dataset, x, y);
    this.title = title;

    makeObservable(this, {
      title: observable,
      setTitle: true,
      mentions: observable,
      mentionList: computed({ keepAlive: true }),
      canDelete: override,
    });
  }

  static fromJson(data: DocumentDB, dataset: Dataset): Document {
    return new Document(data.id, data.title, dataset, data.x, data.y);
  }

  toJson(): DocumentDB {
    return {
      id: this.internal_id,
      title: this.title,
      x: this.x,
      y: this.y,
    };
  }

  setTitle(title: string) {
    this.title = title;
    updateNodeProperties(this.dataset.appState.sigma, this.id, {
      label: this.title,
    });
  }

  get mentionList() {
    return Array.from(this.mentions.values());
  }

  get canDelete(): boolean {
    return this.mentions.size === 0;
  }
}
