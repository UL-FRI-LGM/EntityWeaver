import { GraphEntity } from "@/stores/graphEntity.ts";
import type { Mention } from "@/stores/mention.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { computed, makeObservable, override } from "mobx";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import { type DocumentAttributes, type DocumentDB } from "@/utils/schemas.ts";

export class Document extends GraphEntity {
  static prefix = "Document-";

  mentions: Map<string, Mention> = new Map<string, Mention>();
  text: string;

  attributes: DocumentAttributes;

  constructor(
    internal_id: string,
    text: string,
    dataset: Dataset,
    attributes: DocumentAttributes,
    x?: number,
    y?: number,
  ) {
    super(internal_id, Document.prefix, dataset, x, y, "Document");
    this.text = text;

    makeObservable(this, {
      attributes: true,
      title: true,
      setTitle: true,
      name: true,
      text: true,
      setText: true,
      editText: true,
      mentions: true,
      mentionList: computed({ keepAlive: true }),
      textWithEntities: true,
      dispose: override,
    });

    this.attributes = attributes;
  }

  static fromJson(data: DocumentDB, dataset: Dataset): Document {
    return new Document(
      data.id,
      data.text,
      dataset,
      data.attributes,
      data.x,
      data.y,
    );
  }

  toJson(): DocumentDB {
    return {
      id: this.internal_id,
      text: this.text,
      x: this.x,
      y: this.y,
      attributes: this.attributes,
    };
  }

  get name() {
    return this.attributes.title;
  }

  get title() {
    return this.name;
  }

  setTitle(title: string) {
    this.attributes.title = title;
    updateNodeProperties(this.dataset.appState.sigma, this.id, {
      label: title,
    });
  }

  editText(startIndex: number, endIndex: number, newText: string) {
    const before = this.text.slice(0, startIndex);
    const after = this.text.slice(endIndex);
    this.setText(before + newText + after);

    const lengthDiff = newText.length - (endIndex - startIndex);
    for (const mention of this.mentions.values()) {
      if (mention.start_index >= endIndex) {
        mention.setIndices(
          mention.start_index + lengthDiff,
          mention.end_index + lengthDiff,
        );
      } else if (
        mention.start_index <= startIndex &&
        mention.end_index >= endIndex
      ) {
        mention.setIndices(mention.start_index, mention.end_index + lengthDiff);
      }
    }
  }

  setText(text: string) {
    this.text = text;
  }

  get mentionList() {
    // console.log("Getting mention list for document:", this.internal_id);
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
        mention: mention,
      });
      currentIndex = mention.end_index;
    }
    if (currentIndex < this.text.length) {
      spans.push({ text: this.text.slice(currentIndex) });
    }

    return spans;
  }

  override dispose() {
    if (!this.canDelete) return;

    for (const mention of this.mentions.values()) {
      mention.dispose();
    }

    super.dispose();
  }
}
