const edgeWidth = 4;

export const DEFINES = {
  uiStateStorageKey: "graph-ui-state",
  sizePerEdge: 5,
  minNodeSize: 15,
  maxNodeSize: 50,
  layoutRuntimeInMs: 1000,
  backgroundColor: "#EAEAEA",
  selection: {
    borderColor: "#b70000",
    edgeColor: "#b70000",
  },
  uiHover: {
    borderColor: "#048385",
  },
  document: {
    color: "#f5d96e",
    iconColor: "black",
    size: 30,
    borderSize: 0.1,
  },
  entity: {
    color: "#61b5d4",
    iconColor: "black",
    borderSize: 0.15,
  },
  mention: {
    color: "#f56563",
    iconColor: "black",
    size: 10,
    borderSize: 0.2,
  },
  edges: {
    MentionToDocument: {
      color: "#282828",
      width: edgeWidth,
    },
    MentionToEntity: {
      color: "#767676",
      width: edgeWidth,
    },
    EntityToDocument: {
      color: "#282828",
      width: edgeWidth,
    },
    MentionCollocation: {
      color: "#b0b0b0",
      width: edgeWidth,
    },
    EntityCollocation: {
      color: "#b0b0b0",
      width: edgeWidth,
    },
  },
  entityTypes: {
    colors: {
      PER: "#f5ad76",
      ORG: "#e07685",
      LOC: "#96b7a8",
      MISC: "#468dd3",
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
      MISC: "/miscellaneous.svg",
      default: "/unknown.svg",
    },
  },
  layout: {
    edgeWeights: {
      MentionToDocument: 3,
      MentionToEntity: 1,
      EntityToDocument: 0,
      MentionCollocation: 0,
      EntityCollocation: 0,
    },
  },
} as const;
