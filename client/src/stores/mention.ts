import {
  getParentOfType,
  getRoot,
  type Instance,
  types,
} from "mobx-state-tree";
import type Sigma from "sigma";
import type { EdgeType, NodeType, RootInstance } from "@/stores/rootStore.ts";
import { updateMentionNode } from "@/utils/graphHelpers.ts";
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

export const Link = types
  .model({
    entity: types.reference(types.late(() => Entity)),
  })
  .actions((self) => ({
    remove() {
      const mention = getParentOfType(self, Mention) as MentionInstance;
      mention?.removeEntityLink(self.entity.id);
    },
  }));

export interface LinkInstance extends Instance<typeof Link> {}

export const Mention = types
  .model({
    id: types.identifier,
    name: types.string,
    type: types.string,
    document: types.reference(types.late(() => Document)),
    entityLinks: types.map(Link),
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
  .actions((self) => {
    return {
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
              if (link.entity.id !== entityId) {
                self.entityLinks.delete(link.entity.id);
              }
            });
          }
        }
        if (!alreadyHasLink) {
          self.entityLinks.set(entityId, { entity: entityId });
        }
        if (self.sigma) {
          updateMentionNode(self.sigma, self.id, {
            addedEntityLinks: [entityId],
            clearEntityLinks: !keepExisting,
          });
        }
      },
    };
  });

export interface MentionInstance extends Instance<typeof Mention> {}
