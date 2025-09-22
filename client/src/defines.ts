const edgeWidth = 4;

export const DEFINES = {
  uiStateStorageKey: "graph-ui-state",
  sizePerEdge: 5,
  minNodeSize: 15,
  maxNodeSize: 50,
  layoutRuntimeInMs: 1000,
  selection: {
    borderColor: "#b70000",
  },
  uiHover: {
    borderColor: "#048385",
  },
  document: {
    color: "#ffff00",
    iconColor: "black",
    size: 30,
    borderSize: 0.1,
  },
  entity: {
    color: "#0036ff",
    iconColor: "white",
    borderSize: 0.15,
  },
  mention: {
    color: "#FA4F40",
    iconColor: "black",
    size: 10,
    borderSize: 0.2,
  },
  mentionToDocumentEdge: {
    color: "#282828",
    width: edgeWidth,
  },
  mentionToEntityEdge: {
    color: "#a4a4a4",
    width: edgeWidth,
  },
  entityToDocumentEdge: {
    color: "#282828",
    width: edgeWidth,
  },
  collocationEdge: {
    color: "#b0b0b0",
    width: edgeWidth,
  },
  entityTypes: {
    colors: {
      PER: "#ff8200",
      ORG: "#fa4f40",
      LOC: "#27a60a",
      MISC: "#658dfc",
    },
    iconColor: {
      PER: "black",
      ORG: "black",
      LOC: "black",
      MISC: "black",
    },
    names: {
      PER: "Person",
      ORG: "Organization",
      LOC: "Location",
      MISC: "Miscellaneous",
    },
    images: {
      PER: "/person.svg",
      ORG: "/organization.svg",
      LOC: "/location.svg",
      MISC: "/concept.svg",
      default: "/unknown.svg",
    },
  },
  layout: {
    edgeWeights: {
      MentionToDocument: 0.5,
      MentionToEntity: 1,
      EntityToDocument: 0,
      MentionCollocation: 2,
      EntityCollocation: 0,
    },
  },
} as const;
