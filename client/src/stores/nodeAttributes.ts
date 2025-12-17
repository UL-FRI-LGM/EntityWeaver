import { Dataset, type GraphNodeType } from "@/stores/dataset.ts";
import { computed, makeAutoObservable, observable } from "mobx";
import { z } from "zod";
import {
  type AttributeDataTypeSchema,
  type AttributeSchema,
  AttributeValueSchema,
} from "@/utils/schemas.ts";
import type { Field } from "react-querybuilder";
import { DEFINES } from "@/defines.ts";
import {
  setPropertiesForNodesOfType,
  updatePropertiesForNodesOfType,
} from "@/utils/graphHelpers.ts";
import type { NodeSource } from "@/stores/appState.ts";

export type AttributeDB = z.output<typeof AttributeSchema>;
export type AttributeValueDB = z.output<typeof AttributeValueSchema>;

export type AttributeDataType = z.output<typeof AttributeDataTypeSchema>;

export class AttributeValue {
  name: string;
  label: string | undefined;
  color: string;

  attribute: Attribute;

  constructor(
    attribute: Attribute,
    name: string,
    label?: string,
    color?: string,
  ) {
    this.name = name;
    this.label = label;
    this.color = color ?? "#ffffff";

    makeAutoObservable(this, {
      attribute: false,
    });

    this.attribute = attribute;
  }

  toJson(): AttributeValueDB {
    return {
      name: this.name,
      label: this.label,
      color: this.color,
    };
  }

  static fromJson(attribute: Attribute, attributeValue: AttributeValueDB) {
    if (typeof attributeValue === "string") {
      return new AttributeValue(attribute, attributeValue);
    }
    return new AttributeValue(
      attribute,
      attributeValue.name,
      attributeValue.label,
      attributeValue.color,
    );
  }

  setColor(color: string) {
    this.color = color;

    if (
      this.attribute.nodeTypeProperties.colorSource === "attribute" &&
      this.attribute.nodeTypeProperties.colorAttribute === this.attribute
    ) {
      this.attribute.nodeTypeProperties.updateNodeColorsToAttribute();
    }
  }
}

export class Attribute {
  name: string;
  label: string | undefined;
  type: AttributeDataType;
  valueMap: Map<string, AttributeValue> | undefined;

  nodeTypeProperties: NodeTypeProperties;

  constructor(
    nodeTypeProperties: NodeTypeProperties,
    name: string,
    type: AttributeDataType,
    label?: string,
  ) {
    this.name = name;
    this.type = type;
    this.label = label;

    makeAutoObservable(this, {
      nodeTypeProperties: false,
      field: computed({ keepAlive: true }),
      values: computed({ keepAlive: true }),
    });

    this.nodeTypeProperties = nodeTypeProperties;
  }

  get values(): AttributeValue[] | undefined {
    return this.valueMap ? Array.from(this.valueMap.values()) : undefined;
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
      records: [this.nodeTypeProperties.nodeType],
      label: this.label,
      values: this.values?.map((value) => value.toJson()),
    };
  }

  addAttributeValue(value: AttributeValue) {
    if (this.type !== "enum") {
      console.warn(
        `Cannot add value to attribute ${this.name} of type ${this.type}, only enum attributes can have values.`,
      );
      return;
    }
    if (!this.valueMap) {
      this.valueMap = new Map<string, AttributeValue>();
    }
    if (this.valueMap.has(value.name)) {
      console.warn(
        `Value ${value.name} already exists for attribute ${this.name}, it will be overwritten.`,
      );
    }
    this.valueMap.set(value.name, value);
  }

  static fromJson(
    nodeTypeProperties: NodeTypeProperties,
    attribute: AttributeDB,
  ): Attribute {
    const attributeInstance = new Attribute(
      nodeTypeProperties,
      attribute.name,
      attribute.type,
      attribute.label,
    );
    if (attribute.values) {
      for (const attributeValue of attribute.values) {
        attributeInstance.addAttributeValue(
          AttributeValue.fromJson(attributeInstance, attributeValue),
        );
      }
    }

    return attributeInstance;
  }
}

export type colorSource = "type" | "attribute";

export class NodeTypeProperties {
  nodeType: GraphNodeType;
  typeColor: string;
  colorAttribute: Attribute | undefined;

  colorSource: colorSource;

  attributeManager: AttributeManager;
  attributeMap: Map<string, Attribute> = new Map<string, Attribute>();

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
      attributes: computed({ keepAlive: true }),
      attributeMap: observable.shallow,
    });

    this.attributeManager = attributeManager;
  }

  get attributes() {
    return Array.from(this.attributeMap.values());
  }

  addAttribute(attribute: Attribute) {
    if (this.attributeMap.has(attribute.name)) {
      console.warn(
        `Attribute ${attribute.name} already exists for node type ${this.nodeType}, it will be overwritten.`,
      );
    }
    this.attributeMap.set(attribute.name, attribute);
  }

  clearAttributes() {
    this.attributeMap.clear();
  }

  setColorSource(source: colorSource) {
    if (this.colorSource === source) return;

    this.colorSource = source;

    if (this.colorSource === "type") {
      this.updateNodeColorsToType();
    } else {
      this.updateNodeColorsToAttribute();
    }
  }

  setTypeColor(color: string) {
    this.typeColor = color;

    if (this.colorSource === "type") {
      this.updateNodeColorsToType();
    }
  }

  updateNodeColorsToType() {
    setPropertiesForNodesOfType(
      this.attributeManager.dataset.appState.sigma,
      this.nodeType,
      {
        color: this.typeColor,
      },
    );
  }

  updateNodeColorsToAttribute() {
    const attribute = this.colorAttribute;
    if (attribute?.type !== "enum") return;

    updatePropertiesForNodesOfType(
      this.attributeManager.dataset.appState.sigma,
      this.nodeType,
      (attributes) => {
        return {
          ...attributes,
          color: this.getColorForNode(attributes.source),
        };
      },
    );
  }

  getColorForNode(nodeSource: NodeSource): string {
    if (this.colorSource === "type") {
      return this.typeColor;
    } else {
      const attribute = this.colorAttribute;
      if (attribute?.type !== "enum") {
        return this.typeColor;
      }

      const attributeValue = nodeSource.attributes.get(attribute.name);
      if (!attributeValue) {
        return this.typeColor;
      }

      const attributeValueInstance = attribute.valueMap?.get(
        attributeValue as string,
      );
      if (!attributeValueInstance) {
        return this.typeColor;
      }

      return attributeValueInstance.color;
    }
  }

  setColorAttribute(attributeName: string) {
    const attribute = this.attributeMap.get(attributeName);
    if (!attribute) {
      console.warn(
        `Attribute ${attributeName} not found for node type ${this.nodeType}`,
      );
      return;
    }

    if (this.colorAttribute === attribute) return;

    this.colorAttribute = attribute;
    this.updateNodeColorsToAttribute();
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
    const attributeManager = new AttributeManager(dataset);
    attributes.forEach((attribute) => {
      attributeManager.addAttribute(attribute);
    });
    return attributeManager;
  }

  clearAttributes() {
    this.nodeProperties.forEach((nodeTypeProperties) => {
      nodeTypeProperties.clearAttributes();
    });
  }

  addAttribute(attribute: AttributeDB) {
    attribute.records.forEach((recordType) => {
      const nodeTypeProperties = this.nodeProperties.get(recordType);
      if (!nodeTypeProperties) {
        console.warn(
          `Node type ${recordType} not found for attribute ${attribute.name}`,
        );
        return;
      }
      const attributeInstance = Attribute.fromJson(
        nodeTypeProperties,
        attribute,
      );
      nodeTypeProperties.addAttribute(attributeInstance);
    });
  }
}
