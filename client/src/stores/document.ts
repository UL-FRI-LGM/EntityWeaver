import { GraphEntity } from "@/stores/graphEntity.ts";
import type { Mention } from "@/stores/mention.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { computed, makeObservable, override } from "mobx";
import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import {
  type AttributeValuesType,
  DocumentAttributes,
  type DocumentSchema,
} from "@/utils/schemas.ts";
import { z } from "zod";

export type DocumentDB = z.output<typeof DocumentSchema>;

export class Document extends GraphEntity {
  static prefix = "Document-";

  mentions: Map<string, Mention> = new Map<string, Mention>();
  text: string;

  constructor(
    internal_id: string,
    text: string,
    dataset: Dataset,
    x?: number,
    y?: number,
    attributes?: Record<string, AttributeValuesType>,
  ) {
    super(internal_id, Document.prefix, dataset, x, y, "Document", attributes);
    this.text = text;

    makeObservable(this, {
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
  }

  static fromJson(data: DocumentDB, dataset: Dataset): Document {
    return new Document(
      data.id,
      data.text,
      dataset,
      data.x,
      data.y,
      data.attributes,
    );
  }

  toJson(): DocumentDB {
    const rawAttributes = this.attributesToJson();
    const attributes: z.infer<typeof DocumentAttributes> | undefined =
      rawAttributes
        ? "title" in rawAttributes
          ? { ...rawAttributes, title: String(rawAttributes.title) }
          : { ...rawAttributes, title: this.internal_id }
        : undefined;

    return {
      id: this.internal_id,
      text: this.text,
      x: this.x,
      y: this.y,
      attributes: attributes,
    };
  }

  get name() {
    return (this.attributes.get("title") as string | undefined) ?? "";
  }

  get title() {
    return this.name;
  }

  setTitle(title: string) {
    this.attributes.set("title", title);
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
