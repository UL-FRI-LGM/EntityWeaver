import { Mention, type MentionDB } from "@/stores/mention.ts";
import { Entity, type EntityDB } from "@/stores/entity.ts";
import { Document, type DocumentDB } from "@/stores/document.ts";
import { Collocation } from "@/stores/collocation.ts";
import { computed, makeAutoObservable, runInAction } from "mobx";
import { appState, type AppState } from "@/stores/appState.ts";
import { loadDemo, readFile, sumAndMax } from "@/utils/helpers.ts";
import { makePersistable } from "mobx-persist-store";
import { DEFINES } from "@/defines.ts";
import {
  type AttributeDB,
  FilterManager,
  FilterSequence,
} from "@/stores/filters.ts";
import { DatasetSchema, RecordTypeSchema } from "@/utils/schemas.ts";
import { z } from "zod";
import { defaultValidator, formatQuery } from "react-querybuilder";
import { add_operation, type RulesLogic } from "json-logic-js";
import { jsonLogicAdditionalOperators } from "react-querybuilder";
import type { GraphEntity } from "@/stores/graphEntity.ts";

for (const [op, func] of Object.entries(jsonLogicAdditionalOperators)) {
  add_operation(op, func);
}

export type GraphNodeType = z.output<typeof RecordTypeSchema>;

export type DatasetDB = z.infer<typeof DatasetSchema>;

export interface BinInfo {
  value: number;
  count: number;
  relative: number;
}

export class Dataset {
  appState: AppState;

  mentions: Map<string, Mention> = new Map<string, Mention>();
  documents: Map<string, Document> = new Map<string, Document>();
  entities: Map<string, Entity> = new Map<string, Entity>();
  collocations: Map<string, Collocation> = new Map<string, Collocation>();

  fetchingData = false;

  filterActive = false;
  filterManager: FilterManager;

  constructor(appState: AppState) {
    this.appState = appState;

    makeAutoObservable(this, {
      mentionList: computed({ keepAlive: true }),
      documentList: computed({ keepAlive: true }),
      entityList: computed({ keepAlive: true }),
      collocationsList: computed({ keepAlive: true }),
      normalizedConfidenceBins: computed({ keepAlive: true }),
      filterManager: false,
    });

    this.filterManager = new FilterManager(this);

    if (import.meta.env.VITE_STORE_GRAPH === "true") {
      makePersistable(this, {
        name: "NERVIS-Dataset",
        properties: [
          {
            key: "documents",
            serialize: (value) => {
              return Array.from(value.values()).map((value) => value.toJson());
            },
            deserialize: (value) => {
              if (!Array.isArray(value)) return new Map<string, Document>();
              return new Map(
                value.map((documentDB: DocumentDB) => {
                  const document = Document.fromJson(documentDB, this);
                  return [document.id, document];
                }),
              );
            },
          },
          {
            // @ts-expect-error: bad TS inference
            key: "entities",
            // @ts-expect-error: bad TS inference
            serialize: (value) => {
              return Array.from(value.values()).map((value) => value.toJson());
            },
            // @ts-expect-error: bad TS inference
            deserialize: (value) => {
              if (!Array.isArray(value)) return new Map<string, Entity>();
              return new Map(
                value.map((entityDB: EntityDB) => {
                  const entity = Entity.fromJson(entityDB, this);
                  return [entity.id, entity];
                }),
              );
            },
          },
          {
            // @ts-expect-error: bad TS inference
            key: "mentions",
            // @ts-expect-error: bad TS inference
            serialize: (value) => {
              return Array.from(value.values()).map((value) => value.toJson());
            },
            // @ts-expect-error: bad TS inference
            deserialize: (value) => {
              if (!Array.isArray(value)) return new Map<string, Mention>();
              return new Map(
                value.map((mentionDB: MentionDB) => {
                  const mention = Mention.fromJson(mentionDB, this);
                  return [mention.id, mention];
                }),
              );
            },
          },
          {
            // @ts-expect-error: bad TS inference
            key: "filterManager",
            // @ts-expect-error: bad TS inference
            serialize: (value) => {
              return value.toJson();
            },
            // @ts-expect-error: bad TS inference
            deserialize: (value: AttributeDB[]) => {
              return FilterManager.fromJson(this, value);
            },
          },
        ],
      })
        .then(() => {
          if (this.hasData) {
            appState.runGraphUpdate(false);
          } else if (import.meta.env.VITE_AUTO_LOAD_DEMO === "true") {
            this.loadDemo().catch(console.error);
          }
        })
        .catch(console.error);
    } else if (import.meta.env.VITE_AUTO_LOAD_DEMO === "true") {
      this.loadDemo().catch(console.error);
    }
  }

  toJson(): DatasetDB {
    return {
      attributes: this.filterManager.toJson(),
      mentions: this.mentionList.map((m) => m.toJson()),
      entities: this.entityList.map((e) => e.toJson()),
      documents: this.documentList.map((d) => d.toJson()),
      collocations: this.collocationsList.map((c) => c.toJson()),
    };
  }

  get hasData() {
    return (
      this.entities.size > 0 ||
      this.mentions.size > 0 ||
      this.documents.size > 0
    );
  }

  get mentionList() {
    return Array.from(this.mentions.values());
  }
  get documentList() {
    return Array.from(this.documents.values());
  }
  get entityList() {
    return Array.from(this.entities.values());
  }
  get collocationsList() {
    return Array.from(this.collocations.values());
  }

  async loadDemo() {
    if (this.fetchingData) return;
    this.fetchingData = true;

    try {
      const data: DatasetDB = await loadDemo();
      this.loadDataset(data);
    } finally {
      runInAction(() => {
        this.fetchingData = false;
      });
    }
  }

  async loadFromFile(file: File) {
    if (this.fetchingData) return;
    this.fetchingData = true;

    try {
      const contents = await readFile(file, "text");
      const dataset = JSON.parse(contents) as DatasetDB;
      this.loadDataset(dataset);
    } finally {
      runInAction(() => {
        this.fetchingData = false;
      });
    }
  }

  loadDataset(inputData: DatasetDB) {
    const data = DatasetSchema.parse(inputData);

    this.mentions.clear();
    this.documents.clear();
    this.entities.clear();
    this.collocations.clear();

    data.documents.forEach((document) => {
      this.documents.set(
        `${Document.prefix}${document.id}`,
        Document.fromJson(document, this),
      );
    });

    data.entities.forEach((entity) => {
      this.entities.set(
        `${Entity.prefix}${entity.id}`,
        Entity.fromJson(entity, this),
      );
    });

    data.mentions.forEach((mention) => {
      this.mentions.set(
        `${Mention.prefix}${mention.id}`,
        Mention.fromJson(mention, this),
      );
    });

    // data.collocations.forEach((collocation) => {
    //   try {
    //     const collocationInstance = Collocation.fromJson(collocation, this);
    //     this.collocations.set(
    //       `${Collocation.prefix}${collocation.id}`,
    //       collocationInstance,
    //     );
    //   } catch (error) {
    //     console.error(error);
    //   }
    // });

    let recomputeLayout = this.mentionList.some(
      (mention) => mention.x === undefined || mention.y === undefined,
    );
    recomputeLayout ||= this.entityList.some(
      (entity) => entity.x === undefined || entity.y === undefined,
    );
    recomputeLayout ||= this.documentList.some(
      (document) => document.x === undefined || document.y === undefined,
    );

    if (this.documentList.length > 0) {
      appState.setViewedDocument(this.documentList[0]);
    }

    data.attributes.forEach((attribute) => {
      this.filterManager.addAttribute(attribute);
    });

    appState.runGraphUpdate(recomputeLayout);
  }

  get normalizedConfidenceBins(): BinInfo[] {
    const confidenceBins = Array<number>(DEFINES.confidenceBins).fill(0);
    const binCount = confidenceBins.length;

    this.mentionList.forEach((mention) => {
      mention.entityLinkList.forEach((entity) => {
        const binIndex = Math.min(
          Math.floor(entity.confidence * binCount),
          binCount - 1,
        );
        confidenceBins[binIndex]++;
      });
    });

    const { sum, max } = sumAndMax(confidenceBins);
    if (max === 0 || max === null) {
      return confidenceBins.map(() => {
        return { value: 0, count: 0, relative: 0 };
      });
    }
    return confidenceBins.map((bin) => {
      return { value: Math.min(1, bin / max), count: bin, relative: bin / sum };
    });
  }

  applyFilterSequences(filterSequences: FilterSequence[]) {
    if (filterSequences.length === 0) return;

    const sigma = this.appState.sigma;
    if (!sigma) return;

    if (this.filterActive) {
      this.removeFilters();
    }

    for (let i = 0; i < filterSequences.length; i += 1) {
      const sequence = filterSequences[i];

      const query = sequence.query;
      const jsonLogic = formatQuery(query, {
        format: "jsonlogic",
        validator: defaultValidator,
      }) as RulesLogic;

      if (jsonLogic === false && sequence.includedIds.length === 0) {
        continue;
      }

      let dataArray: GraphEntity[];
      if (sequence.filterBy === "Mention") {
        dataArray = this.mentionList;
      } else if (sequence.filterBy === "Entity") {
        dataArray = this.entityList;
      } else {
        dataArray = this.documentList;
      }

      const includedIdsSet = new Set(sequence.includedIds);

      dataArray.forEach((entity) => {
        entity.applyFilter(includedIdsSet, jsonLogic, i !== 0);
      });
    }

    this.filterActive = true;

    sigma.refresh();
  }

  removeFilters() {
    this.mentions.forEach((mention) => {
      mention.removeFilter();
    });
    this.documents.forEach((document) => {
      document.removeFilter();
    });
    this.entities.forEach((entity) => {
      entity.removeFilter();
    });
    this.filterActive = false;

    this.appState.sigma?.refresh();
  }
}
