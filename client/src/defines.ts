const edgeWidth = 4;

export const DEFINES = {
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
    color: "#676767",
    width: edgeWidth,
  },
  mentionToEntityEdge: {
    color: "rgb(36,180,59)",
    width: edgeWidth,
  },
  entityToDocumentEdge: {
    color: "#676767",
    width: edgeWidth,
  },
  entityTypes: {
    colors: {
      PER: "#ff8100",
      ORG: "#fd4719",
      LOC: "#36da06",
      MISC: "#07f8f8",
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
} as const;
