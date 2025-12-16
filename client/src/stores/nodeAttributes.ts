import { Dataset, type GraphNodeType } from "@/stores/dataset.ts";
import { computed, makeAutoObservable } from "mobx";
import { z } from "zod";
import {
  type AttributeDataTypeSchema,
  type AttributeSchema,
  AttributeValueSchema,
} from "@/utils/schemas.ts";
import type { Field } from "react-querybuilder";
import { DEFINES } from "@/defines.ts";
import { setNodeTypeProperties } from "@/utils/graphHelpers.ts";

export type AttributeDB = z.output<typeof AttributeSchema>;
export type AttributeValueDB = z.output<typeof AttributeValueSchema>;

export type AttributeDataType = z.output<typeof AttributeDataTypeSchema>;

export class AttributeValue {
  name: string;
  label: string | undefined;
  color: string;

  constructor(name: string, label?: string, color?: string) {
    this.name = name;
    this.label = label;
    this.color = color ?? "#ffffff";

    makeAutoObservable(this);
  }

  toJson(): AttributeValueDB {
    return {
      name: this.name,
      label: this.label,
      color: this.color,
    };
  }

  static fromJson(attributeValue: AttributeValueDB) {
    if (typeof attributeValue === "string") {
      return new AttributeValue(attributeValue);
    }
    return new AttributeValue(
      attributeValue.name,
      attributeValue.label,
      attributeValue.color,
    );
  }

  setColor(color: string) {
    this.color = color;
  }
}

export class Attribute {
  name: string;
  label: string | undefined;
  type: AttributeDataType;
  nodeType: GraphNodeType;
  values: AttributeValue[] | undefined;

  constructor(
    name: string,
    type: AttributeDataType,
    nodeType: GraphNodeType,
    label?: string,
    values?: AttributeValue[],
  ) {
    this.name = name;
    this.type = type;
    this.nodeType = nodeType;
    this.label = label;
    this.values = values;

    makeAutoObservable(this, { field: computed({ keepAlive: true }) });
  }

  get field(): Field {
    return {
      name: this.name,
      label: this.label ?? this.name,
      datatype: this.type,
      values: this.values?.map((value) => {
        return {
          name: value.name,
          label: value.label ?? value.name,
        };
      }),
    };
  }

  toJson(): AttributeDB {
    return {
      name: this.name,
      type: this.type,
      records: [this.nodeType],
      label: this.label,
      values: this.values?.map((value) => value.toJson()),
    };
  }

  static fromJson(attribute: AttributeDB, nodeType: GraphNodeType): Attribute {
    return new Attribute(
      attribute.name,
      attribute.type,
      nodeType,
      attribute.label,
      attribute.values?.map((value) => AttributeValue.fromJson(value)),
    );
  }
}

export type colorSource = "type" | "attribute";

export class NodeTypeProperties {
  nodeType: GraphNodeType;
  typeColor: string;
  colorSource: colorSource;

  attributeManager: AttributeManager;
  attributes: Attribute[];

  constructor(
    attributeManager: AttributeManager,
    nodeType: GraphNodeType,
    typeColor: string,
    colorSource: colorSource,
  ) {
    this.nodeType = nodeType;
    this.typeColor = typeColor;
    this.colorSource = colorSource;

    makeAutoObservable(this, {
      attributeManager: false,
      updateNodeColorsToType: false,
    });

    this.attributeManager = attributeManager;
    this.attributes = [];
  }

  setColorSource(source: colorSource) {
    this.colorSource = source;

    if (this.colorSource === "type") {
      this.updateNodeColorsToType();
    }
  }

  setTypeColor(color: string) {
    this.typeColor = color;

    if (this.colorSource === "type") {
      this.updateNodeColorsToType();
    }
  }

  updateNodeColorsToType() {
    setNodeTypeProperties(
      this.attributeManager.dataset.appState.sigma,
      this.nodeType,
      {
        color: this.typeColor,
      },
    );
  }

  addAttribute(attribute: Attribute) {
    this.attributes.push(attribute);
  }

  clearAttributes() {
    this.attributes = [];
  }
}

export class AttributeManager {
  dataset: Dataset;

  mentionProperties: NodeTypeProperties;
  documentProperties: NodeTypeProperties;
  entityProperties: NodeTypeProperties;

  nodeProperties: Map<GraphNodeType, NodeTypeProperties> = new Map<
    GraphNodeType,
    NodeTypeProperties
  >();

  constructor(dataset: Dataset) {
    this.mentionProperties = new NodeTypeProperties(
      this,
      "Mention",
      DEFINES.nodes.Mention.color,
      "type",
    );
    this.documentProperties = new NodeTypeProperties(
      this,
      "Document",
      DEFINES.nodes.Document.color,
      "type",
    );
    this.entityProperties = new NodeTypeProperties(
      this,
      "Entity",
      DEFINES.nodes.Entity.color,
      "type",
    );
    this.nodeProperties.set("Mention", this.mentionProperties);
    this.nodeProperties.set("Document", this.documentProperties);
    this.nodeProperties.set("Entity", this.entityProperties);

    makeAutoObservable(this, {
      dataset: false,
    });

    this.dataset = dataset;
  }

  toJson(): AttributeDB[] {
    const attributes: AttributeDB[] = [];
    this.nodeProperties.forEach((nodeTypeProperties) => {
      nodeTypeProperties.attributes.forEach((attribute) => {
        attributes.push(attribute.toJson());
      });
    });
    return attributes;
  }

  static fromJson(dataset: Dataset, attributes: AttributeDB[]) {
    const filterManager = new AttributeManager(dataset);
    attributes.forEach((attribute) => {
      filterManager.addAttribute(attribute);
    });
    return filterManager;
  }

  clearAttributes() {
    this.nodeProperties.forEach((nodeTypeProperties) => {
      nodeTypeProperties.clearAttributes();
    });
  }

  addAttribute(attribute: AttributeDB) {
    attribute.records.forEach((recordType) => {
      const attributeInstance = Attribute.fromJson(attribute, recordType);
      const nodeTypeProperties = this.nodeProperties.get(recordType);
      nodeTypeProperties?.addAttribute(attributeInstance);
    });
  }
}
