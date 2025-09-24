import { destroy, getRoot, type Instance, types } from "mobx-state-tree";
import type Sigma from "sigma";
import type { EdgeType, NodeType, RootInstance } from "@/stores/rootStore.ts";
import {
  updateMentionNode,
  updateNodeProperties,
} from "@/utils/graphHelpers.ts";
import { Entity } from "@/stores/entity.ts";
import { Document, type DocumentInstance } from "@/stores/document.ts";

export const mentionPrefix = "Mention-";
export interface MentionDB {
  id: string;
  name: string;
  type: string;
  document_id: string;
  links: {
    entity_id: string;
  }[];
}

// export const Link = types
//   .model({
//     entity: types.reference(types.late(() => Entity)),
//   })
//   .actions((self) => ({
//     remove() {
//       const mention = getParentOfType(self, Mention) as MentionInstance;
//       mention?.removeEntityLink(self.entity.id);
//     },
//   }));

// export interface LinkInstance extends Instance<typeof Link> {}

export const Mention = types
  .model({
    id: types.identifier,
    x: types.maybe(types.number),
    y: types.maybe(types.number),
    name: types.string,
    type: types.string,
    document: types.safeReference(
      types.late(() => Document),
      { acceptsUndefined: false },
    ),
    entityLinks: types.map(
      types.safeReference(Entity, { acceptsUndefined: false }),
    ),
  })
  .views((self) => ({
    get sigma(): Sigma<NodeType, EdgeType> | null {
      const rootStore = getRoot(self) as RootInstance;
      return rootStore.sigma;
    },
    get entityLinkList() {
      return Array.from(self.entityLinks.values());
    },
  }))
  .actions((self) => ({
    afterAttach() {
      self.document.mentions.set(self.id, self);
    },
    setPosition(position: { x?: number | null; y?: number | null }) {
      self.x = position.x ?? undefined;
      self.y = position.y ?? undefined;
      if (self.x !== null || self.y !== null) {
        updateNodeProperties(self.sigma, self.id, { x: self.x, y: self.y });
      }
    },
    setName(name: string) {
      self.name = name;
      if (self.sigma) {
        updateMentionNode(self.sigma, self.id, { label: name });
      }
    },
    setType(type: string) {
      self.type = type;
      if (self.sigma) {
        updateMentionNode(self.sigma, self.id, { type: type });
      }
    },
    setDocumentId(document: DocumentInstance) {
      self.document = document;
      if (self.sigma) {
        updateMentionNode(self.sigma, self.id, { documentId: document.id });
      }
    },
    removeEntityLink(entityId: string) {
      self.entityLinks.delete(entityId);
      if (self.sigma) {
        updateMentionNode(self.sigma, self.id, {
          removedEntityLinks: [entityId],
        });
      }
    },
    setEntityLink(entityId: string, keepExisting = true) {
      const alreadyHasLink = self.entityLinks.has(entityId);
      if (keepExisting && alreadyHasLink) {
        return;
      }
      if (!keepExisting) {
        if (!alreadyHasLink) {
          self.entityLinks.clear();
        } else {
          self.entityLinks.forEach((link) => {
            if (link.id !== entityId) {
              self.entityLinks.delete(link.id);
            }
          });
        }
      }
      if (!alreadyHasLink) {
        self.entityLinks.set(entityId, entityId);
      }
      if (self.sigma) {
        updateMentionNode(self.sigma, self.id, {
          addedEntityLinks: [entityId],
          clearEntityLinks: !keepExisting,
        });
      }
    },
    remove() {
      const rootStore = getRoot(self) as RootInstance;
      rootStore.onNodeDeleted(self.id);
      destroy(self);
    },
  }));

export interface MentionInstance extends Instance<typeof Mention> {}
