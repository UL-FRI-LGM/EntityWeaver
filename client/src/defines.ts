import documentImg from "/document.svg?url";
import locationImg from "/location.svg?url";
import miscImg from "/miscellaneous.svg?url";
import organizationImg from "/organization.svg?url";
import personImg from "/person.svg?url";
import unknownImg from "/unknown.svg?url";
import Color from "color";
import type { AttributeDB } from "@/utils/schemas.ts";

const edgeWidth = 1;

export const DEFINES = {
  maxQueryLevels: 5,
  maxFilterSequences: 6,
  contextWindow: 30,
  uiStateStorageKey: "graph-ui-state",
  sizePerEdge: 5,
  minNodeSize: 15,
  maxNodeSize: 50,
  layoutRuntimeInMs: 2000,
  backgroundColor: "#EAEAEA",
  selection: {
    borderColor: "#b70000",
    edgeColor: "#b70000",
  },
  uiHover: {
    borderColor: "#048385",
  },
  nodes: {
    Document: {
      color: "#f5d96e",
      iconColor: "black",
      // size: 30,
      // size: 20,
      size: 15,
      borderSize: 0.1,
      borderColor: "black",
      image: documentImg,
    },
    Entity: {
      color: "#61b5d4",
      iconColor: "black",
      // size: 15,
      // size: 12,
      size: 8,
      borderSize: 0.15,
      borderColor: "black",
    },
    Mention: {
      color: "#f56563",
      iconColor: "black",
      // size: 10,
      // size: 8,
      size: 5,
      borderSize: 0.2,
      borderColor: "#696969",
    },
  },
  confidenceBins: 100,
  gradientEditorDebounceMs: 100,
  defaultTFStops: [
    {
      threshold: 0,
      color: new Color("hsl(360, 100%, 68%)"),
    },
    {
      threshold: 0.5,
      color: new Color("hsl(360, 0%, 68%)"),
    },
    {
      threshold: 1,
      color: new Color("#26AF13"),
    },
  ],
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
      EntityToDocument: 1,
      MentionCollocation: 0,
      EntityCollocation: 0,
    },
  },
} as const;

export const RESERVED_ATTRIBUTES: AttributeDB[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    records: ["Entity", "Mention"],
  },
  {
    name: "title",
    label: "Title",
    type: "text",
    records: ["Document"],
  },
] as const;
