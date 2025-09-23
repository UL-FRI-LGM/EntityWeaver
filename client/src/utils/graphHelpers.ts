import { DEFINES } from "../defines.ts";
import seedrandom, { type PRNG } from "seedrandom";
import type Sigma from "sigma";
import type {
  EdgeType,
  NodeType,
  UiStateInstance,
} from "@/stores/rootStore.ts";
import { typeIconToColor, typeToColor, typeToImage } from "./helpers.ts";
import type { DatasetInstance, GraphNodeType } from "@/stores/dataset.ts";
import type { MentionInstance } from "@/stores/mention.ts";
import type Graph from "graphology";

function getRandomPosition(generator?: PRNG) {
  return generator ? generator() : Math.random();
}

function getNodeSize(edges: number) {
  const size = edges * DEFINES.sizePerEdge;
  if (size < DEFINES.minNodeSize) return DEFINES.minNodeSize;
  if (size > DEFINES.maxNodeSize) return DEFINES.maxNodeSize;
  return size;
}

// TODO should be cached
export function isNodeHidden(
  uiState: UiStateInstance,
  nodeAttributes: NodeType,
) {
  return (
    (uiState.entityView && nodeAttributes.nodeType === "Mention") ||
    (!uiState.filters.entities && nodeAttributes.nodeType === "Entity") ||
    (!uiState.filters.mentions && nodeAttributes.nodeType === "Mention") ||
    (!uiState.filters.documents && nodeAttributes.nodeType === "Document") ||
    (!uiState.filters.people && nodeAttributes.entityType === "PER") ||
    (!uiState.filters.locations && nodeAttributes.entityType === "LOC") ||
    (!uiState.filters.organizations && nodeAttributes.entityType === "ORG") ||
    (!uiState.filters.miscellaneous && nodeAttributes.entityType === "MISC")
  );
}

export function nodeAdjacentToHighlighted(
  graph: Graph<NodeType, EdgeType>,
  node: string,
  highlightedNodes: Set<string>,
  entityView: boolean,
) {
  for (const edge of graph.edges(node)) {
    const neighbor = graph.opposite(node, edge)!;
    if (highlightedNodes.has(neighbor)) {
      const edgeAttr = graph.getEdgeAttributes(edge);
      if (
        entityView ||
        (edgeAttr.connectionType !== "EntityToDocument" &&
          edgeAttr.connectionType !== "EntityCollocation")
      ) {
        return true;
      }
    }
  }
  return false;
}

function getNodeColors(
  nodeType: GraphNodeType,
  entityType: string,
  colorByEntityType: boolean,
) {
  if (colorByEntityType) {
    return {
      color: typeToColor(entityType) ?? DEFINES.entityTypes.colors.MISC,
      pictogramColor:
        typeIconToColor(entityType) ?? DEFINES.entityTypes.iconColor.MISC,
    };
  } else {
    return nodeType === "Entity"
      ? {
          color: DEFINES.entity.color,
          pictogramColor: DEFINES.entity.iconColor,
        }
      : {
          color: DEFINES.mention.color,
          pictogramColor: DEFINES.mention.iconColor,
        };
  }
}

export function setColorByType(
  sigma: Sigma<NodeType, EdgeType> | null,
  state: boolean,
) {
  if (!sigma) {
    return;
  }
  const graph = sigma.getGraph();
  graph.forEachNode((nodeId, attributes) => {
    if (attributes.nodeType === "Document" || !attributes.entityType) {
      return;
    }
    const { color, pictogramColor } = getNodeColors(
      attributes.nodeType,
      attributes.entityType,
      state,
    );
    graph.setNodeAttribute(nodeId, "color", color);
    graph.setNodeAttribute(nodeId, "pictogramColor", pictogramColor);
  });
}

export function updateNodeProperties(
  sigma: Sigma<NodeType, EdgeType> | null,
  nodeId: string,
  properties: Partial<NodeType>,
) {
  if (!sigma) {
    return;
  }
  const graph = sigma.getGraph();
  graph.mergeNodeAttributes(nodeId, properties);
}

export function updateMentionNode(
  sigma: Sigma<NodeType, EdgeType>,
  nodeId: string,
  update: {
    label?: string;
    type?: string;
    documentId?: string;
    clearEntityLinks?: boolean;
    addedEntityLinks?: string[]; // array of entity IDs
    removedEntityLinks?: string[]; // array of entity IDs
  },
) {
  const graph = sigma.getGraph();
  const node = graph.getNodeAttributes(nodeId);
  if (!node) {
    console.warn(`Node with id ${nodeId} not found in the graph.`);
    return;
  }

  if (update.label !== undefined && update.label !== node.label) {
    graph.updateNodeAttribute(nodeId, "label", () => update.label!);
  }

  if (update.type !== undefined && update.type !== node.type) {
    const entityImage = typeToImage(update.type);
    graph.updateNodeAttribute(nodeId, "image", () => entityImage);
  }

  if (update.documentId !== undefined) {
    const edges = graph.edges(nodeId);
    edges.forEach((edgeId) => {
      const edge = graph.getEdgeAttributes(edgeId);
      if (edge.connectionType === "MentionToDocument") {
        graph.dropEdge(edgeId);
      }
    });
    graph.addEdge(nodeId, update.documentId, {
      size: DEFINES.mentionToDocumentEdge.width,
      color: DEFINES.mentionToDocumentEdge.color,
      connectionType: "MentionToDocument",
    });
  }

  if (update.clearEntityLinks) {
    const edges = graph.edges(nodeId);
    for (const edgeId of edges) {
      if (update.addedEntityLinks) {
        const entityId = graph.opposite(nodeId, edgeId);
        if (update.addedEntityLinks.includes(entityId)) {
          continue;
        }
      }
      const edge = graph.getEdgeAttributes(edgeId);
      if (edge.connectionType === "MentionToEntity") {
        graph.dropEdge(edgeId);
      }
    }
  }

  if (update.addedEntityLinks) {
    for (const entityId of update.addedEntityLinks) {
      if (graph.hasEdge(nodeId, entityId)) {
        continue;
      }
      graph.addEdge(nodeId, entityId, {
        size: DEFINES.mentionToEntityEdge.width,
        color: DEFINES.mentionToEntityEdge.color,
        connectionType: "MentionToEntity",
      });
    }
  }

  if (update.removedEntityLinks) {
    for (const entityId of update.removedEntityLinks) {
      const edges = graph.edges(nodeId, entityId);
      for (const edgeId of edges) {
        const edge = graph.getEdgeAttributes(edgeId);
        if (edge.connectionType === "MentionToEntity") {
          graph.dropEdge(edgeId);
        }
      }
    }
  }
}

export function updateEntityViewEdges(
  sigma: Sigma<NodeType, EdgeType> | null,
  dataset: DatasetInstance,
) {
  if (!sigma) {
    return;
  }
  const graph = sigma.getGraph();
  graph.forEachEdge((edgeId, attributes) => {
    if (
      attributes.connectionType === "EntityToDocument" ||
      attributes.connectionType === "EntityCollocation"
    ) {
      graph.dropEdge(edgeId);
    }
  });

  for (const entity of dataset.entityList) {
    const mentions = dataset.mentionList.filter((mention) =>
      mention.entityLinkList.some((link) => link.entity.id === entity.id),
    );
    const connectedDocuments = new Set<string>();
    for (const mention of mentions) {
      connectedDocuments.add(mention.document.id);
    }
    for (const documentId of connectedDocuments) {
      graph.addEdge(entity.id, documentId, {
        size: DEFINES.entityToDocumentEdge.width,
        color: DEFINES.entityToDocumentEdge.color,
        connectionType: "EntityToDocument",
      });
    }

    const collocatedMentions = new Set<MentionInstance>();
    for (const collocation of dataset.collocationsList) {
      for (const mention of collocation.mentionsList) {
        if (mentions.some((m) => m.id === mention.id)) {
          collocation.mentionsList.forEach((m) => {
            collocatedMentions.add(m);
          });
        }
      }
    }

    collocatedMentions.forEach((mention) => {
      for (const entityLink of mention.entityLinkList) {
        if (entityLink.entity.id === entity.id) {
          continue;
        }
        if (graph.hasEdge(entity.id, entityLink.entity.id)) {
          continue;
        }
        graph.addEdge(entity.id, entityLink.entity.id, {
          size: DEFINES.collocationEdge.width,
          color: DEFINES.collocationEdge.color,
          connectionType: "EntityCollocation",
        });
      }
    });
  }
}

export function updateGraph(
  sigma: Sigma<NodeType, EdgeType>,
  dataset: DatasetInstance,
  colorByEntityType: boolean,
  seed = "hello.",
) {
  const rng = seedrandom(seed);
  const graph = sigma.getGraph();
  graph.clear();

  dataset.documents.forEach((document) => {
    graph.addNode(document.id, {
      x: document.x ?? getRandomPosition(rng),
      y: document.y ?? getRandomPosition(rng),
      size: DEFINES.document.size,
      label: document.title,
      color: DEFINES.document.color,
      image: "/document.svg",
      pictogramColor: DEFINES.document.iconColor,
      type: "pictogram",
      borderSize: DEFINES.document.borderSize,
      nodeType: "Document",
      zIndex: 0,
    });
  });
  dataset.entities.forEach((entity) => {
    const entityImage = typeToImage(entity.type);
    const { color, pictogramColor } = getNodeColors(
      "Entity",
      entity.type,
      colorByEntityType,
    );
    graph.addNode(entity.id, {
      x: entity.x ?? getRandomPosition(rng),
      y: entity.y ?? getRandomPosition(rng),
      size: 15,
      label: entity.name,
      color: color,
      image: entityImage,
      pictogramColor: pictogramColor,
      type: "pictogram",
      borderSize: DEFINES.entity.borderSize,
      nodeType: "Entity",
      entityType: entity.type,
      zIndex: 10,
    });
  });
  dataset.mentions.forEach((mention) => {
    const entityImage = typeToImage(mention.type);
    const { color, pictogramColor } = getNodeColors(
      "Mention",
      mention.type,
      colorByEntityType,
    );
    graph.addNode(mention.id, {
      x: mention.x ?? getRandomPosition(rng),
      y: mention.y ?? getRandomPosition(rng),
      size: DEFINES.mention.size,
      label: mention.name,
      color: color,
      image: entityImage,
      pictogramColor: pictogramColor,
      type: "pictogram",
      borderSize: DEFINES.mention.borderSize,
      nodeType: "Mention",
      entityType: mention.type,
      zIndex: 20,
    });

    const document = dataset.documents.get(mention.document.id);
    if (document) {
      graph.addEdge(mention.id, document.id, {
        size: DEFINES.mentionToDocumentEdge.width,
        color: DEFINES.mentionToDocumentEdge.color,
        connectionType: "MentionToDocument",
        zIndex: 1,
      });
    }

    mention.entityLinks.forEach((link) => {
      graph.addEdge(mention.id, link.entity.id, {
        size: DEFINES.mentionToEntityEdge.width,
        color: DEFINES.mentionToEntityEdge.color,
        connectionType: "MentionToEntity",
        zIndex: 2,
      });
    });
  });

  dataset.collocations.forEach((collocation) => {
    for (let i = 0; i < collocation.mentionsList.length - 1; i++) {
      for (let j = i + 1; j < collocation.mentionsList.length; j++) {
        const mentionA = collocation.mentionsList[i];
        const mentionB = collocation.mentionsList[j];
        if (graph.hasEdge(mentionA.id, mentionB.id)) {
          continue;
        }
        graph.addEdge(mentionA.id, mentionB.id, {
          size: DEFINES.collocationEdge.width,
          color: DEFINES.collocationEdge.color,
          connectionType: "MentionCollocation",
        });
      }
    }
  });

  // for (const document of dataset.documents) {
  //   const nodeSize = getNodeSize(graph.edges(document.globalId).length);
  //   graph.updateNodeAttribute(document.globalId, "size", () => nodeSize);
  // }
  dataset.entities.forEach((entity) => {
    const nodeSize = getNodeSize(graph.edges(entity.id).length);
    graph.updateNodeAttribute(entity.id, "size", () => nodeSize);
  });

  sigma.refresh();
}
