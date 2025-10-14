import { GraphEntity } from "@/stores/graphEntity.ts";
import type { Mention } from "@/stores/mention.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { computed, makeObservable, observable, override } from "mobx";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";

export interface DocumentDB {
  id: string;
  title: string;
  text: string;
  x?: number;
  y?: number;
}

export class Document extends GraphEntity {
  static prefix = "Document-";

  title: string;
  mentions: Map<string, Mention> = new Map<string, Mention>();
  text: string;

  constructor(
    internal_id: string,
    title: string,
    text: string,
    dataset: Dataset,
    x?: number,
    y?: number,
  ) {
    super(internal_id, Document.prefix, dataset, x, y);
    this.title = title;
    this.text = text;

    makeObservable(this, {
      title: observable,
      setTitle: true,
      text: observable,
      mentions: observable,
      mentionList: computed({ keepAlive: true }),
      textWithEntities: true,
      canDelete: override,
    });
  }

  static fromJson(data: DocumentDB, dataset: Dataset): Document {
    return new Document(
      data.id,
      data.title,
      data.text,
      dataset,
      data.x,
      data.y,
    );
  }

  toJson(): DocumentDB {
    return {
      id: this.internal_id,
      title: this.title,
      text: this.text,
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
    return Array.from(this.mentions.values()).sort(
      (a, b) => a.start_index - b.start_index,
    );
  }

  get textWithEntities() {
    const mentionList = this.mentionList;
    if (mentionList.length === 0) return [{ text: this.text }];
    const spans: { text: string; mention?: Mention }[] = [];
    let currentIndex = 0;
    for (const mention of mentionList) {
      if (mention.start_index > currentIndex) {
        spans.push({
          text: this.text.slice(currentIndex, mention.start_index),
        });
      }
      spans.push({
        text: this.text.slice(mention.start_index, mention.end_index),
        mention,
      });
      currentIndex = mention.end_index;
    }
    if (currentIndex < this.text.length) {
      spans.push({ text: this.text.slice(currentIndex) });
    }

    return spans;
  }

  get canDelete(): boolean {
    return this.mentions.size === 0;
  }
}
