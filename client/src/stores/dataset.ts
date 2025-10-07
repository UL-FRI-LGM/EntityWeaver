import {
  flow,
  getRoot,
  getSnapshot,
  getType,
  type Instance,
  isAlive,
  type SnapshotIn,
  types,
} from "mobx-state-tree";
import {
  Mention,
  type MentionDB,
  type MentionInstance,
  mentionPrefix,
} from "@/stores/mention.ts";
import {
  Entity,
  type EntityDB,
  type EntityInstance,
  entityPrefix,
} from "@/stores/entity.ts";
import {
  Document,
  type DocumentDB,
  type DocumentInstance,
  documentPrefix,
} from "@/stores/document.ts";
import { loadDemo, nextFrame } from "@/utils/helpers.ts";
import type { RootInstance } from "@/stores/rootStore.ts";
import { Collocation, type CollocationDB } from "@/stores/collocation.ts";

export type GraphNodeType = "Document" | "Entity" | "Mention";
export type GraphNodeInstance =
  | DocumentInstance
  | EntityInstance
  | MentionInstance;

export interface DatasetDB {
  mentions: MentionDB[];
  entities: EntityDB[];
  documents: DocumentDB[];
  collocations: CollocationDB[];
}

export const Dataset = types
  .model({
    mentions: types.map(Mention),
    documents: types.map(Document),
    entities: types.map(Entity),
    collocations: types.map(Collocation),
  })
  .volatile(() => ({
    fetchingData: false,
  }))
  .views((self) => ({
    get mentionList() {
      return Array.from(self.mentions.values());
    },
    get documentList() {
      return Array.from(self.documents.values());
    },
    get entityList() {
      return Array.from(self.entities.values());
    },
    get collocationsList() {
      return Array.from(self.collocations.values());
    },
    get hasData() {
      return (
        self.entities.size > 0 ||
        self.mentions.size > 0 ||
        self.documents.size > 0
      );
    },
  }))
  .actions((self) => ({
    toJSON() {
      return getSnapshot(self);
    },
    deleteNode(nodeInstance: GraphNodeInstance) {
      if (getType(nodeInstance) === Document) {
        self.documents.get(nodeInstance.id)?.remove();
      } else if (getType(nodeInstance) === Entity) {
        self.entities.get(nodeInstance.id)?.remove();
      } else if (getType(nodeInstance) === Mention) {
        self.mentions.get(nodeInstance.id)?.remove();
      }
    },
    setNodePosition(
      nodeId: string,
      nodeType: GraphNodeType,
      position: { x?: number | null; y?: number | null },
    ) {
      if (nodeType === "Document") {
        const document = self.documents.get(nodeId);
        if (!document) {
          console.warn(`Document with id ${nodeId} not found`);
          return;
        }
        document.setPosition(position);
        return;
      } else if (nodeType === "Entity") {
        const entity = self.entities.get(nodeId);
        if (!entity) {
          console.warn(`Entity with id ${nodeId} not found`);
          return;
        }
        entity.setPosition(position);
      } else if (nodeType === "Mention") {
        const mention = self.mentions.get(nodeId);
        if (!mention) {
          console.warn(`Mention with id ${nodeId} not found`);
          return;
        }
        mention.setPosition(position);
      }
    },
    loadDataset(data: DatasetDB) {
      self.mentions.clear();
      self.documents.clear();
      self.entities.clear();
      self.collocations.clear();
      console.log(data);

      data.documents.forEach((document) => {
        document.id = `${documentPrefix}${document.id}`;
        self.documents.set(document.id, document);
      });

      data.entities.forEach((entity) => {
        entity.id = `${entityPrefix}${entity.id}`;
        self.entities.set(entity.id, entity);
      });

      data.mentions.forEach((mention) => {
        mention.id = `${mentionPrefix}${mention.id}`;
        mention.document_id = `${documentPrefix}${mention.document_id}`;
        self.mentions.set(mention.id, {
          id: mention.id,
          name: mention.name,
          type: mention.type,
          document: mention.document_id,
          entityLinks: Object.fromEntries(
            mention.links.map((link) => {
              link.entity_id = `${entityPrefix}${link.entity_id}`;
              const linkedEntity = self.entities.get(link.entity_id);
              if (!linkedEntity) {
                throw new Error(`Entity with id ${link.entity_id} not found`);
              }
              return [linkedEntity.id, linkedEntity.id];
            }),
          ),
        });
      });

      data.collocations.forEach((collocation) => {
        collocation.id = `Collocation-${collocation.id}`;
        const mentionsMap = new Map<string, string>();
        const fullDocumentId = `${documentPrefix}${collocation.document_id}`;
        collocation.mentions.forEach((mentionId) => {
          const fullMentionId = `${mentionPrefix}${mentionId}`;
          const mention = self.mentions.get(fullMentionId);
          if (!mention) {
            console.warn(
              `Mention with id ${fullMentionId} not found for collocation ${collocation.id}`,
            );
            return;
          }
          if (mention?.document.id !== fullDocumentId) {
            console.warn(
              `Mention with id ${fullMentionId} does not belong to document ${fullDocumentId} for collocation ${collocation.id}`,
            );
            return;
          }
          mentionsMap.set(mention.id, mention.id);
        });
        if (mentionsMap.size < 2) {
          console.warn(
            `Collocation with id ${collocation.id} has less than 2 valid mentions, skipping`,
          );
          return;
        }
        self.collocations.set(collocation.id, {
          id: collocation.id,
          mentions: Object.fromEntries(mentionsMap),
        });
      });
      const rootStore = getRoot<RootInstance>(self);
      rootStore?.onDatasetUpdate();
    },
  }))
  .actions((self) => ({
    afterAttach() {
      if (import.meta.env.VITE_AUTO_LOAD_DEMO === "true") {
        this.loadDemo().catch((err) => console.error(err));
      }
    },
    loadDemo: flow(function* () {
      if (self.fetchingData) return;
      self.fetchingData = true;
      yield nextFrame();

      const data: DatasetDB = yield loadDemo();
      if (!isAlive(self)) {
        return;
      }
      self.loadDataset(data);

      self.fetchingData = false;
    }),
  }));

export interface DatasetInstance extends Instance<typeof Dataset> {}
export interface DatasetSnapShotIn extends SnapshotIn<typeof Dataset> {}
