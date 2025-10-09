import { Mention, type MentionDB } from "@/stores/mention.ts";
import { Entity, type EntityDB } from "@/stores/entity.ts";
import { Document, type DocumentDB } from "@/stores/document.ts";
import { Collocation, type CollocationDB } from "@/stores/collocation.ts";
import { makeAutoObservable, runInAction } from "mobx";
import { appState, type AppState } from "@/stores/appState.ts";
import type { GraphEntity } from "@/stores/graphEntity.ts";
import { loadDemo, readFile } from "@/utils/helpers.ts";
import { makePersistable } from "mobx-persist-store";

export type GraphNodeType = "Document" | "Entity" | "Mention";

export interface DatasetDB {
  mentions: MentionDB[];
  entities: EntityDB[];
  documents: DocumentDB[];
  collocations: CollocationDB[];
}

export class Dataset {
  appState: AppState;

  mentions: Map<string, Mention> = new Map<string, Mention>();
  documents: Map<string, Document> = new Map<string, Document>();
  entities: Map<string, Entity> = new Map<string, Entity>();
  collocations: Map<string, Collocation> = new Map<string, Collocation>();
  fetchingData = false;

  constructor(appState: AppState) {
    this.appState = appState;
    makeAutoObservable(this);

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
            // @ts-ignore
            key: "entities",
            // @ts-ignore
            serialize: (value) => {
              return Array.from(value.values()).map((value) => value.toJson());
            },
            // @ts-ignore
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
            // @ts-ignore
            key: "mentions",
            // @ts-ignore
            serialize: (value) => {
              return Array.from(value.values()).map((value) => value.toJson());
            },
            // @ts-ignore
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
        ],
      })
        .then(() => {
          if (this.hasData) {
            appState.runGraphUpdate(false);
          } else if (import.meta.env.VITE_LOAD_DEMO === "true") {
            this.loadDemo().catch((error) => console.error(error));
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else if (import.meta.env.VITE_LOAD_DEMO === "true") {
      this.loadDemo().catch((error) => console.error(error));
    }
  }

  toJson(): DatasetDB {
    return {
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

  setNodePosition(
    nodeId: string,
    nodeType: GraphNodeType,
    position: { x?: number | null; y?: number | null },
  ) {
    if (nodeType === "Document") {
      const document = this.documents.get(nodeId);
      if (!document) {
        console.warn(`Document with id ${nodeId} not found`);
        return;
      }
      document.setPosition(position);
      return;
    } else if (nodeType === "Entity") {
      const entity = this.entities.get(nodeId);
      if (!entity) {
        console.warn(`Entity with id ${nodeId} not found`);
        return;
      }
      entity.setPosition(position);
    } else if (nodeType === "Mention") {
      const mention = this.mentions.get(nodeId);
      if (!mention) {
        console.warn(`Mention with id ${nodeId} not found`);
        return;
      }
      mention.setPosition(position);
    }
  }

  deleteNode(nodeInstance: GraphEntity) {
    if (nodeInstance instanceof Document) {
      this.documents.get(nodeInstance.id)?.dispose();
    } else if (nodeInstance instanceof Entity) {
      this.entities.get(nodeInstance.id)?.dispose();
    } else if (nodeInstance instanceof Mention) {
      this.mentions.get(nodeInstance.id)?.dispose();
    }
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

  loadDataset(data: DatasetDB) {
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

    data.collocations.forEach((collocation) => {
      try {
        const collocationInstance = Collocation.fromJson(collocation, this);
        this.collocations.set(
          `${Collocation.prefix}${collocation.id}`,
          collocationInstance,
        );
      } catch (error) {
        console.error(error);
      }
    });

    let recomputeLayout = this.mentionList.some(
      (mention) => mention.x === undefined || mention.y === undefined,
    );
    recomputeLayout ||= this.entityList.some(
      (entity) => entity.x === undefined || entity.y === undefined,
    );
    recomputeLayout ||= this.documentList.some(
      (document) => document.x === undefined || document.y === undefined,
    );

    appState.runGraphUpdate(recomputeLayout);
  }
}
