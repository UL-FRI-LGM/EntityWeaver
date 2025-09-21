import { DEFINES } from "../defines.ts";
import seedrandom, { type PRNG } from "seedrandom";
import type Sigma from "sigma";
import type {
  DatasetInstance,
  EdgeType,
  NodeType,
} from "@/stores/rootStore.ts";
import { typeToImage } from "./helpers.ts";

function getRandomPosition(generator?: PRNG) {
  return {
    x: generator ? generator() : Math.random(),
    y: generator ? generator() : Math.random(),
  };
}

function getNodeSize(edges: number) {
  const size = edges * DEFINES.sizePerEdge;
  if (size < DEFINES.minNodeSize) return DEFINES.minNodeSize;
  if (size > DEFINES.maxNodeSize) return DEFINES.maxNodeSize;
  return size;
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
      if (edge.connectionType === "Document") {
        graph.dropEdge(edgeId);
      }
    });
    graph.addEdge(nodeId, update.documentId, {
      size: DEFINES.documentToMentionEdge.width,
      color: DEFINES.documentToMentionEdge.color,
      connectionType: "Document",
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
      if (edge.connectionType === "Entity") {
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
        connectionType: "Entity",
      });
    }
  }

  if (update.removedEntityLinks) {
    for (const entityId of update.removedEntityLinks) {
      const edges = graph.edges(nodeId, entityId);
      for (const edgeId of edges) {
        const edge = graph.getEdgeAttributes(edgeId);
        if (edge.connectionType === "Entity") {
          graph.dropEdge(edgeId);
        }
      }
    }
  }
}

export function updateGraph(
  sigma: Sigma<NodeType, EdgeType>,
  dataset: DatasetInstance,
  seed = "hello.",
) {
  const rng = seedrandom(seed);
  const graph = sigma.getGraph();
  graph.clear();

  dataset.documents.forEach((document) => {
    graph.addNode(document.id, {
      ...getRandomPosition(rng),
      size: DEFINES.document.size,
      label: document.title,
      color: DEFINES.document.color,
      image: "/document.svg",
      pictogramColor: DEFINES.document.iconColor,
      type: "pictogram",
    });
  });
  dataset.entities.forEach((entity) => {
    const entityImage = typeToImage(entity.type);
    graph.addNode(entity.id, {
      ...getRandomPosition(rng),
      size: 15,
      label: entity.name,
      color: DEFINES.entity.color,
      image: entityImage,
      pictogramColor: DEFINES.entity.iconColor,
      type: "pictogram",
    });
  });
  dataset.mentions.forEach((mention) => {
    const entityImage = typeToImage(mention.type);
    graph.addNode(mention.id, {
      ...getRandomPosition(rng),
      size: DEFINES.mention.size,
      label: mention.name,
      color: DEFINES.mention.color,
      image: entityImage,
      pictogramColor: DEFINES.mention.iconColor,
      type: "pictogram",
    });

    const document = dataset.documents.get(mention.documentId);
    if (document) {
      graph.addEdge(mention.id, document.id, {
        size: DEFINES.documentToMentionEdge.width,
        color: DEFINES.documentToMentionEdge.color,
        connectionType: "Document",
      });
    }

    mention.entityLinks.forEach((link) => {
      graph.addEdge(mention.id, link.entity.id, {
        size: DEFINES.mentionToEntityEdge.width,
        color: DEFINES.mentionToEntityEdge.color,
        connectionType: "Entity",
      });
    });
  });
  // for (const document of dataset.documents) {
  //   const nodeSize = getNodeSize(graph.edges(document.globalId).length);
  //   graph.updateNodeAttribute(document.globalId, "size", () => nodeSize);
  // }
  dataset.entities.forEach((entity) => {
    const nodeSize = getNodeSize(graph.edges(entity.id).length);
    graph.updateNodeAttribute(entity.id, "size", () => nodeSize);
  });
}
