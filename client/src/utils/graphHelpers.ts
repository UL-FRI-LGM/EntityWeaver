import { DEFINES } from "../defines.ts";
import seedrandom, { type PRNG } from "seedrandom";
import type Sigma from "sigma";
import {
  appState,
  AppState,
  type EdgeType,
  type NodeType,
} from "@/stores/appState.ts";
import {
  edgeTypeToProperties,
  typeIconToColor,
  typeToColor,
  typeToImage,
  uncertaintyToEdgeColor,
} from "./helpers.ts";
import { Dataset, type GraphNodeType } from "@/stores/dataset.ts";
import type Graph from "graphology";
import { getCameraStateToFitViewportToNodes } from "@sigma/utils";
import type { UiState } from "@/stores/uiState.ts";
import { EntityLink, type Mention } from "@/stores/mention.ts";

function getRandomPosition(generator?: PRNG) {
  return generator ? generator() : Math.random() * 10000;
}

// function getNodeSize(edges: number) {
//   const size = edges * DEFINES.sizePerEdge;
//   if (size < DEFINES.minNodeSize) return DEFINES.minNodeSize;
//   if (size > DEFINES.maxNodeSize) return DEFINES.maxNodeSize;
//   return size;
// }

// TODO should be cached
export function isNodeHidden(
  appState: AppState,
  nodeId: string,
  nodeAttributes: NodeType,
) {
  if (!appState.sigma) return;
  const uiState = appState.uiState;
  const graph = appState.sigma.getGraph();

  return (
    (uiState.entityView && nodeAttributes.nodeType === "Mention") ||
    (!uiState.filters.entities && nodeAttributes.nodeType === "Entity") ||
    (!uiState.filters.mentions && nodeAttributes.nodeType === "Mention") ||
    (!uiState.filters.documents && nodeAttributes.nodeType === "Document") ||
    (!uiState.filters.people && nodeAttributes.entityType === "PER") ||
    (!uiState.filters.locations && nodeAttributes.entityType === "LOC") ||
    (!uiState.filters.organizations && nodeAttributes.entityType === "ORG") ||
    (!uiState.filters.miscellaneous && nodeAttributes.entityType === "MISC") ||
    (appState.focusedNode &&
      nodeId !== appState.focusedNode &&
      !areVisibleNeighbors(
        graph,
        appState.uiState,
        appState.focusedNode,
        nodeId,
      ))
  );
}

export function isEdgeHidden(uiState: UiState, edgeAttributes: EdgeType) {
  return (
    (!uiState.entityView &&
      (edgeAttributes.connectionType === "EntityToDocument" ||
        edgeAttributes.connectionType === "EntityCollocation")) ||
    (!uiState.filters.collocations &&
      (edgeAttributes.connectionType === "EntityCollocation" ||
        edgeAttributes.connectionType === "MentionCollocation"))
  );
}

function areVisibleNeighbors(
  graph: Graph<NodeType, EdgeType>,
  uiState: UiState,
  nodeId: string,
  otherNodeId: string,
) {
  const edgeId = graph.edge(nodeId, otherNodeId);
  if (edgeId === undefined) return false;
  return !isEdgeHidden(uiState, graph.getEdgeAttributes(edgeId));
}

export function nodeAdjacentToHighlighted(
  graph: Graph<NodeType, EdgeType>,
  uiState: UiState,
  node: string,
  highlightedNodes: Set<string>,
  highlightedEdges: Set<string>,
) {
  if (highlightedNodes.size > 0) {
    for (const edge of graph.edges(node)) {
      const neighbor = graph.opposite(node, edge);
      if (highlightedNodes.has(neighbor)) {
        if (!isEdgeHidden(uiState, graph.getEdgeAttributes(edge))) {
          return true;
        }
      }
    }
  }
  for (const edge of highlightedEdges) {
    if (graph.hasEdge(edge) && graph.hasExtremity(edge, node)) {
      return true;
    }
  }
  return false;
}

export function assignRandomPositions(
  sigma: Sigma<NodeType, EdgeType>,
  seed = "hello.",
) {
  const rng = seedrandom(seed);
  for (const node of sigma.getGraph().nodes()) {
    if (
      isNodeHidden(appState, node, sigma.getGraph().getNodeAttributes(node))
    ) {
      continue;
    }
    sigma.getGraph().setNodeAttribute(node, "x", getRandomPosition(rng));
    sigma.getGraph().setNodeAttribute(node, "y", getRandomPosition(rng));
  }
}

export function computeLayoutContribution(sigma: Sigma<NodeType, EdgeType>) {
  const graph = sigma.getGraph();
  for (const edge of graph.edges()) {
    const edgeAttributes = graph.getEdgeAttributes(edge);
    let edgeWeight = DEFINES.layout.edgeWeights[edgeAttributes.connectionType];
    if (isEdgeHidden(appState.uiState, edgeAttributes)) {
      edgeWeight = 0;
    } else {
      for (const nodeId of graph.extremities(edge)) {
        if (isNodeHidden(appState, nodeId, graph.getNodeAttributes(nodeId))) {
          edgeWeight = 0;
          break;
        }
      }
    }
    graph.mergeEdgeAttributes(edge, { layoutWeight: edgeWeight });
  }
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

export function updateEdgeProperties(
  sigma: Sigma<NodeType, EdgeType> | null,
  edgeId: string,
  properties: Partial<EdgeType>,
) {
  if (!sigma) {
    return;
  }
  const graph = sigma.getGraph();
  graph.mergeEdgeAttributes(edgeId, properties);
}

export async function zoomInOnNodeNeighbors(
  sigma: Sigma<NodeType, EdgeType>,
  appState: AppState,
  nodeId: string,
) {
  const graph = sigma.getGraph();
  let nodes = graph.neighbors(nodeId);
  nodes = nodes.filter(
    (n) =>
      !isNodeHidden(appState, n, graph.getNodeAttributes(n)) &&
      areVisibleNeighbors(graph, appState.uiState, nodeId, n),
  );
  nodes.push(nodeId);
  const cameraState = getCameraStateToFitViewportToNodes(
    // @ts-expect-error: function expects base sigma type
    sigma,
    nodes,
  );
  await sigma.getCamera().animate(cameraState, { duration: 1000 });
}

export function updateMentionNode(
  sigma: Sigma<NodeType, EdgeType>,
  nodeId: string,
  update: {
    label?: string;
    type?: string;
    documentId?: string;
    clearEntityLinks?: boolean;
    addedEntityLinks?: EntityLink[]; // array of entity IDs
    removedEntityLinks?: string[]; // array of entity IDs
  },
) {
  const graph = sigma.getGraph();
  const node = graph.getNodeAttributes(nodeId);

  if (update.label !== undefined && update.label !== node.label) {
    graph.setNodeAttribute(nodeId, "label", update.label);
  }

  if (update.type !== undefined && update.type !== node.type) {
    const entityImage = typeToImage(update.type);
    graph.setNodeAttribute(nodeId, "image", entityImage);
  }

  if (update.documentId !== undefined) {
    const edges = graph.edges(nodeId);
    edges.forEach((edgeId) => {
      const edge = graph.getEdgeAttributes(edgeId);
      if (edge.connectionType === "MentionToDocument") {
        graph.dropEdge(edgeId);
      }
    });
    graph.addUndirectedEdge(nodeId, update.documentId, {
      size: DEFINES.edges.MentionToDocument.width,
      color: DEFINES.edges.MentionToDocument.color,
      connectionType: "MentionToDocument",
    });
  }

  if (update.clearEntityLinks) {
    const edges = graph.edges(nodeId);
    for (const edgeId of edges) {
      if (update.addedEntityLinks) {
        const entityId = graph.opposite(nodeId, edgeId);
        if (
          update.addedEntityLinks.some((link) => link.entity.id === entityId)
        ) {
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
    for (const link of update.addedEntityLinks) {
      if (graph.hasEdge(nodeId, link.entity.id)) {
        continue;
      }
      addMentionToEntityEdge(graph, link);
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

export function restoreEdgeProperties(
  sigma: Sigma<NodeType, EdgeType>,
  edgeId: string,
) {
  const attributes = sigma.getGraph().getEdgeAttributes(edgeId);
  const properties = edgeTypeToProperties(attributes.connectionType);
  updateEdgeProperties(sigma, edgeId, {
    color: properties.color,
    size: properties.width,
  });
}

export function updateEntityViewEdges(
  sigma: Sigma<NodeType, EdgeType> | null,
  dataset: Dataset,
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
    const mentions = entity.mentionList;
    const connectedDocuments = new Set<string>();
    for (const mention of mentions) {
      connectedDocuments.add(mention.document.id);
    }
    for (const documentId of connectedDocuments) {
      graph.addUndirectedEdge(entity.id, documentId, {
        size: DEFINES.edges.EntityToDocument.width,
        color: DEFINES.edges.EntityToDocument.color,
        connectionType: "EntityToDocument",
      });
    }

    const collocatedMentions = new Set<Mention>();
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
        graph.addUndirectedEdge(entity.id, entityLink.entity.id, {
          size: DEFINES.edges.MentionCollocation.width,
          color: DEFINES.edges.MentionCollocation.color,
          connectionType: "EntityCollocation",
        });
      }
    });
  }
}

export function updateGraph(
  sigma: Sigma<NodeType, EdgeType>,
  dataset: Dataset,
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
      image: DEFINES.document.image,
      pictogramColor: DEFINES.document.iconColor,
      type: "pictogram",
      borderSize: DEFINES.document.borderSize,
      nodeType: "Document",
      zIndex: 0,
      source: document,
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
      size: DEFINES.entity.size,
      label: entity.name,
      color: color,
      image: entityImage,
      pictogramColor: pictogramColor,
      type: "pictogram",
      borderSize: DEFINES.entity.borderSize,
      nodeType: "Entity",
      entityType: entity.type,
      zIndex: 10,
      source: entity,
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
      source: mention,
    });

    const document = mention.document;
    graph.addUndirectedEdge(mention.id, document.id, {
      size: DEFINES.edges.MentionToDocument.width,
      color: DEFINES.edges.MentionToDocument.color,
      connectionType: "MentionToDocument",
      zIndex: 1,
    });

    mention.entityLinks.forEach((link) => {
      addMentionToEntityEdge(graph, link);
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
        graph.addUndirectedEdge(mentionA.id, mentionB.id, {
          size: DEFINES.edges.MentionCollocation.width,
          color: DEFINES.edges.MentionCollocation.color,
          connectionType: "MentionCollocation",
        });
      }
    }
  });

  // for (const document of dataset.documents) {
  //   const nodeSize = getNodeSize(graph.edges(document.globalId).length);
  //   graph.updateNodeAttribute(document.globalId, "size", () => nodeSize);
  // }
  // dataset.entities.forEach((entity) => {
  //   const nodeSize = getNodeSize(graph.edges(entity.id).length);
  //   graph.updateNodeAttribute(entity.id, "size", () => nodeSize);
  // });

  sigma.refresh();
}

export function addMentionToEntityEdge(
  graph: Graph<NodeType, EdgeType>,
  link: EntityLink,
) {
  const edgeColor = uncertaintyToEdgeColor(link.confidence);
  graph.addUndirectedEdge(link.mention.id, link.entity.id, {
    size: DEFINES.edges.MentionToEntity.width,
    color: edgeColor.hex(),
    connectionType: "MentionToEntity",
    zIndex: 2,
  });
}
