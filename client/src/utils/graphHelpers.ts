import { DEFINES } from "../defines.ts";
import seedrandom, { type PRNG } from "seedrandom";
import type Sigma from "sigma";
import {
  type EdgeType,
  type NodeType,
  type RootInstance,
  rootStore,
  type UiStateInstance,
} from "@/stores/rootStore.ts";
import {
  edgeTypeToProperties,
  typeIconToColor,
  typeToColor,
  typeToImage,
} from "./helpers.ts";
import type { DatasetInstance, GraphNodeType } from "@/stores/dataset.ts";
import type { MentionInstance } from "@/stores/mention.ts";
import type Graph from "graphology";
import { getCameraStateToFitViewportToNodes } from "@sigma/utils";

function getRandomPosition(generator?: PRNG) {
  return generator ? generator() : Math.random() * 100;
}

function getNodeSize(edges: number) {
  const size = edges * DEFINES.sizePerEdge;
  if (size < DEFINES.minNodeSize) return DEFINES.minNodeSize;
  if (size > DEFINES.maxNodeSize) return DEFINES.maxNodeSize;
  return size;
}

// TODO should be cached
export function isNodeHidden(
  appState: RootInstance,
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

export function isEdgeHidden(
  uiState: UiStateInstance,
  edgeAttributes: EdgeType,
) {
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
  uiState: UiStateInstance,
  nodeId: string,
  otherNodeId: string,
) {
  const edges =
    graph.edges(nodeId, otherNodeId) ?? graph.edges(otherNodeId, nodeId);
  if (edges.length === 0) return false;
  const edgeId = edges[0];
  return !isEdgeHidden(uiState, graph.getEdgeAttributes(edgeId));
}

export function nodeAdjacentToHighlighted(
  graph: Graph<NodeType, EdgeType>,
  uiState: UiStateInstance,
  node: string,
  highlightedNodes: Set<string>,
  highlightedEdges: Set<string>,
) {
  if (highlightedNodes.size > 0) {
    for (const edge of graph.edges(node)) {
      const neighbor = graph.opposite(node, edge)!;
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
      isNodeHidden(rootStore, node, sigma.getGraph().getNodeAttributes(node))
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
    if (isEdgeHidden(rootStore.uiState, edgeAttributes)) {
      edgeWeight = 0;
    } else {
      for (const nodeId of graph.extremities(edge)) {
        if (isNodeHidden(rootStore, nodeId, graph.getNodeAttributes(nodeId))) {
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
  appState: RootInstance,
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
    // @ts-ignore: TS2345
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
        size: DEFINES.edges.MentionToEntity.width,
        color: DEFINES.edges.MentionToEntity.color,
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
      mention.entityLinkList.some((link) => link.id === entity.id),
    );
    const connectedDocuments = new Set<string>();
    for (const mention of mentions) {
      if (mention.document) {
        connectedDocuments.add(mention.document.id);
      }
    }
    for (const documentId of connectedDocuments) {
      graph.addEdge(entity.id, documentId, {
        size: DEFINES.edges.EntityToDocument.width,
        color: DEFINES.edges.EntityToDocument.color,
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
        if (entityLink.id === entity.id) {
          continue;
        }
        if (graph.hasEdge(entity.id, entityLink.id)) {
          continue;
        }
        graph.addEdge(entity.id, entityLink.id, {
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

    const document = mention.document
      ? dataset.documents.get(mention.document.id)
      : null;
    if (document) {
      graph.addEdge(mention.id, document.id, {
        size: DEFINES.edges.MentionToDocument.width,
        color: DEFINES.edges.MentionToDocument.color,
        connectionType: "MentionToDocument",
        zIndex: 1,
      });
    }

    mention.entityLinks.forEach((link) => {
      graph.addEdge(mention.id, link.id, {
        size: DEFINES.edges.MentionToEntity.width,
        color: DEFINES.edges.MentionToEntity.color,
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
  dataset.entities.forEach((entity) => {
    const nodeSize = getNodeSize(graph.edges(entity.id).length);
    graph.updateNodeAttribute(entity.id, "size", () => nodeSize);
  });

  sigma.refresh();
}
