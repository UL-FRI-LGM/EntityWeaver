const edgeWidth = 4;

export const DEFINES = {
  sizePerEdge: 5,
  minNodeSize: 15,
  maxNodeSize: 50,
  document: {
    color: "#ffff00",
    iconColor: "black",
    size: 30,
  },
  entityGroup: {
    color: "#0036ff",
    iconColor: "white",
  },
  entity: {
    color: "#FA4F40",
    iconColor: "black",
    size: 10,
  },
  documentToEntityEdge: {
    color: "#676767",
    width: edgeWidth,
  },
  groupToEntityEdge: {
    color: "rgb(36,180,59)",
    width: edgeWidth,
  },
  typeColors: {
    PER: "#ff8100",
    ORG: "#fd4719",
    LOC: "#36da06",
    MISC: "#07f8f8",
    default: "#ffffff",
  },
} as const;
