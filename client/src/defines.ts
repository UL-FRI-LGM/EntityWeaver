import documentImg from "/document.svg?url";
import locationImg from "/location.svg?url";
import miscImg from "/miscellaneous.svg?url";
import organizationImg from "/organization.svg?url";
import personImg from "/person.svg?url";
import unknownImg from "/unknown.svg?url";

const edgeWidth = 2;

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
    image: documentImg,
  },
  entity: {
    color: "#61b5d4",
    iconColor: "black",
    size: 15,
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
      PER: personImg,
      ORG: organizationImg,
      LOC: locationImg,
      MISC: miscImg,
      default: unknownImg,
    },
  },
  layout: {
    edgeWeights: {
      MentionToDocument: 3,
      MentionToEntity: 1,
      EntityToDocument: 0,
      MentionCollocation: 1,
      EntityCollocation: 0,
    },
  },
} as const;
