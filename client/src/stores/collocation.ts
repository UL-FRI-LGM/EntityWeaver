import { Mention } from "@/stores/mention.ts";
import { Document } from "@/stores/document.ts";
import { computed, makeAutoObservable } from "mobx";
import type { Dataset } from "@/stores/dataset.ts";
import type { CollocationDB } from "@/utils/schemas.ts";

export class Collocation {
  static prefix = "Collocation-";

  id: string;
  internal_id: string;
  document: Document;
  dataset: Dataset;
  mentions: Map<string, Mention> = new Map<string, Mention>();

  constructor(
    internal_id: string,
    document: Document,
    dataset: Dataset,
    mentions: Mention[] = [],
  ) {
    this.internal_id = internal_id;
    this.id = Collocation.prefix + internal_id;
    this.document = document;
    this.dataset = dataset;

    mentions.forEach((mention) => {
      this.mentions.set(mention.id, mention);
    });

    makeAutoObservable(this, { mentionsList: computed({ keepAlive: true }) });
  }

  static fromJson(data: CollocationDB, dataset: Dataset): Collocation {
    const document = dataset.documents.get(Document.prefix + data.document_id);
    if (!document) {
      throw new Error(
        `Document with id ${data.document_id} not found for Collocation ${data.id}`,
      );
    }

    const mentions: Mention[] = [];
    data.mentions.forEach((mentionId) => {
      const mention = dataset.mentions.get(Mention.prefix + mentionId);
      if (!mention) {
        console.warn(
          `Mention with id ${mentionId} not found for Collocation ${data.id}`,
        );
        return;
      }
      if (mention.document.id !== document.id) {
        console.warn(
          `Mention with id ${mentionId} does not belong to Document ${data.document_id} for Collocation ${data.id}`,
        );
        return;
      }
      mentions.push(mention);
    });

    if (mentions.length < 2) {
      throw new Error(
        `Collocation ${data.id} has no valid mentions, cannot be created`,
      );
    }
    return new Collocation(data.id, document, dataset, mentions);
  }

  toJson(): CollocationDB {
    return {
      id: this.internal_id,
      document_id: this.document.id,
      mentions: Array.from(this.mentions.values()).map((m) => m.internal_id),
    };
  }

  get mentionsList() {
    return Array.from(this.mentions.values());
  }
}
