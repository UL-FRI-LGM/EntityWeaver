import { DEFINES } from "../defines.ts";
import seedrandom, { type PRNG } from "seedrandom";
import type {
  DatasetInstance,
  EdgeType,
  NodeType,
} from "../stores/rootStore.ts";
import type Sigma from "sigma";

export async function sendApiRequest(
  url: string,
  request: RequestInit,
  options?: { query?: Record<string, string> },
) {
  if (!request.method) {
    throw new Error("The 'method' option is required.");
  }
  const defaultOptions: RequestInit = {};

  if (options?.query !== undefined) {
    url += "?" + new URLSearchParams(options.query);
  }

  const fetchOptions = { ...defaultOptions, ...request };

  let errorMsg = "Error connecting to the server.";

  const response = await fetch(
    `http://localhost:3000/api/${url}`,
    fetchOptions,
  );

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type");
    const isJson = contentType?.includes("application/json");
    const content = isJson ? await response.json() : await response.text();

    errorMsg = isJson ? content.message : content;

    console.error(
      `Error when calling ${url}: (${response.status}) ${errorMsg}`,
    );
    throw new Error(errorMsg);
  }
  return response;
}

export function typeToString(type: string) {
  if (type in DEFINES.entityTypes.names)
    return DEFINES.entityTypes.names[
      type as keyof typeof DEFINES.entityTypes.names
    ];
  return DEFINES.entityTypes.names.default;
}

export function typeToColor(type: string) {
  if (type in DEFINES.entityTypes.colors)
    return DEFINES.entityTypes.colors[
      type as keyof typeof DEFINES.entityTypes.colors
    ];
  return null;
}

export function typeToImage(type: string) {
  if (type in DEFINES.entityTypes.images)
    return DEFINES.entityTypes.images[
      type as keyof typeof DEFINES.entityTypes.images
    ];
  return DEFINES.entityTypes.images.default;
}

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
  dataset.entityGroups.forEach((group) => {
    const entityImage = typeToImage(group.type);
    graph.addNode(group.id, {
      ...getRandomPosition(rng),
      size: 15,
      label: group.name,
      color: DEFINES.entityGroup.color,
      image: entityImage,
      pictogramColor: DEFINES.entityGroup.iconColor,
      type: "pictogram",
    });
  });
  dataset.entities.forEach((entity) => {
    const entityImage = typeToImage(entity.type);
    graph.addNode(entity.id, {
      ...getRandomPosition(rng),
      size: DEFINES.entity.size,
      label: entity.name,
      color: DEFINES.entity.color,
      image: entityImage,
      pictogramColor: DEFINES.entity.iconColor,
      type: "pictogram",
    });

    const document = dataset.documents.get(entity.document_id);
    if (document) {
      graph.addEdge(entity.id, document.id, {
        size: DEFINES.documentToEntityEdge.width,
        color: DEFINES.documentToEntityEdge.color,
      });
    }

    const group = entity.group_id
      ? dataset.entityGroups.get(entity.group_id)
      : undefined;
    if (group) {
      graph.addEdge(entity.id, group.id, {
        size: DEFINES.groupToEntityEdge.width,
        color: DEFINES.groupToEntityEdge.color,
      });
    }
  });
  // for (const document of dataset.documents) {
  //   const nodeSize = getNodeSize(graph.edges(document.globalId).length);
  //   graph.updateNodeAttribute(document.globalId, "size", () => nodeSize);
  // }
  dataset.entityGroups.forEach((group) => {
    const nodeSize = getNodeSize(graph.edges(group.id).length);
    graph.updateNodeAttribute(group.id, "size", () => nodeSize);
  });
}
