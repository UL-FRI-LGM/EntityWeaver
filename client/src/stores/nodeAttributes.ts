import { Dataset } from "@/stores/dataset.ts";
import { computed, makeAutoObservable, observable } from "mobx";
import {
  type AttributeDataType,
  type AttributeDB,
  type AttributeValueDB,
  type GraphNodeType,
} from "@/utils/schemas.ts";
import type { Field } from "react-querybuilder";
import { DEFINES, RESERVED_ATTRIBUTES } from "@/defines.ts";
import {
  setPropertiesForNodesOfType,
  updatePropertiesForNodesOfType,
} from "@/utils/graphHelpers.ts";
import type { NodeSource } from "@/stores/appState.ts";
import { defaultIcon, type Icon, IconMap } from "@/utils/iconsHelper.tsx";
import { getDefaultColor } from "@/utils/helpers.ts";
import { v4 as uuidv4 } from "uuid";

export class AttributeValue {
  name: string;
  label: string | undefined;
  color: string;
  glyph: Icon | undefined;

  attribute: Attribute;

  constructor(
    attribute: Attribute,
    name: string,
    label?: string,
    color?: string,
    glyph?: string,
  ) {
    this.name = name;
    this.label = label;

    // Very hackish, TODO improve this
    this.color = color ?? getDefaultColor(attribute.valueMap?.size ?? 0);

    if (glyph) {
      this.glyph = IconMap.get(glyph);
    }
    if (!this.glyph && label) {
      this.glyph = IconMap.get(label);
    }
    if (!this.glyph && name) {
      this.glyph = IconMap.get(name);
    }

    makeAutoObservable(this, {
      attribute: false,
    });

    this.attribute = attribute;
  }

  get displayName(): string {
    return this.label ?? this.name;
  }

  toJson(): AttributeValueDB {
    return {
      name: this.name,
      label: this.label,
      color: this.color,
      glyph: this.glyph?.url,
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
      attributeValue.glyph,
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

  setGlyph(glyph: string) {
    const icon = IconMap.get(glyph);
    if (!icon) {
      console.warn(`Icon ${glyph} not found.`);
      return;
    }

    this.glyph = icon;
    if (
      this.attribute.nodeTypeProperties.glyphSource === "attribute" &&
      this.attribute.nodeTypeProperties.glyphAttribute === this.attribute
    ) {
      this.attribute.nodeTypeProperties.updateNodeGlyphToAttribute();
    }
  }
}

export class Attribute {
  id: string;
  name: string;
  label: string | undefined;
  type: AttributeDataType;
  valueMap: Map<string, AttributeValue> | undefined;

  nodeTypeProperties: NodeTypeProperties;

  // Prevents deletion
  reserved: boolean;

  constructor(
    nodeTypeProperties: NodeTypeProperties,
    name: string,
    type: AttributeDataType,
    label?: string,
    reserved = false,
  ) {
    this.id = uuidv4();
    this.name = name;
    this.type = type;
    this.label = label;

    this.reserved = reserved;

    makeAutoObservable(this, {
      nodeTypeProperties: false,
      field: computed({ keepAlive: true }),
      values: computed({ keepAlive: true }),
      id: false,
    });

    this.nodeTypeProperties = nodeTypeProperties;
  }

  get values(): AttributeValue[] | undefined {
    return this.valueMap ? Array.from(this.valueMap.values()) : undefined;
  }

  get displayName(): string {
    return this.label ?? this.name;
  }

  get isValidColorAttribute(): boolean {
    return (
      this.type === "enum" &&
      this.valueMap !== undefined &&
      this.valueMap.size > 1
    );
  }

  get isValidGlyphAttribute(): boolean {
    return (
      this.type === "enum" &&
      this.valueMap !== undefined &&
      this.valueMap.size > 1
    );
  }

  get field(): Field {
    return {
      name: this.name,
      label: this.displayName,
      datatype: this.type,
      values: this.values?.map((value) => {
        return {
          name: value.name,
          label: value.displayName,
        };
      }),
    };
  }

  toJson(): AttributeDB {
    return {
      name: this.name,
      type: this.type,
      records: [this.nodeTypeProperties.nodeType],
      activeColor: this.nodeTypeProperties.colorAttribute === this,
      activeGlyph: this.nodeTypeProperties.glyphAttribute === this,
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
        `Value ${value.name} already exists for attribute ${this.name}, skipping.`,
      );
      return;
    }

    this.valueMap.set(value.name, value);
  }

  static fromJson(
    nodeTypeProperties: NodeTypeProperties,
    attribute: AttributeDB,
    reserved = false,
  ): Attribute {
    const attributeInstance = new Attribute(
      nodeTypeProperties,
      attribute.name,
      attribute.type,
      attribute.label,
      reserved,
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

export type ColorSource = "type" | "attribute";
export type GlyphSource = "type" | "attribute";

export class NodeTypeProperties {
  nodeType: GraphNodeType;

  colorSource: ColorSource;
  typeColor: string;
  colorAttribute: Attribute | undefined;

  glyphSource: GlyphSource;
  typeGlyph: Icon;
  glyphAttribute: Attribute | undefined;

  attributeManager: AttributeManager;
  attributeMap: Map<string, Attribute> = new Map<string, Attribute>();

  constructor(
    attributeManager: AttributeManager,
    nodeType: GraphNodeType,

    colorSource: ColorSource,
    typeColor: string,

    glyphSource: GlyphSource,
    typeGlyph: string,
  ) {
    this.nodeType = nodeType;

    this.colorSource = colorSource;
    this.typeColor = typeColor;

    this.glyphSource = glyphSource;
    const icon = IconMap.get(typeGlyph);
    this.typeGlyph = icon ?? defaultIcon;

    makeAutoObservable(this, {
      attributeManager: false,
      updateNodeColorsToType: false,
      attributes: computed({ keepAlive: true }),
      nonReservedAttributes: computed({ keepAlive: true }),
      attributeMap: observable.shallow,
    });

    this.attributeManager = attributeManager;
  }

  get attributes() {
    return Array.from(this.attributeMap.values());
  }

  get nonReservedAttributes() {
    return this.attributes.filter((attribute) => !attribute.reserved);
  }

  addAttribute(attribute: Attribute) {
    if (this.attributeMap.has(attribute.name)) {
      console.warn(
        `Attribute ${attribute.name} already exists for node type ${this.nodeType}, skipping.`,
      );
      return;
    }
    this.attributeMap.set(attribute.name, attribute);
    if (attribute.isValidColorAttribute) {
      this.setColorAttribute(attribute.name);
    }
    if (attribute.isValidGlyphAttribute) {
      this.setGlyphAttribute(attribute.name);
    }
  }

  clearAttributes() {
    for (const [name, attribute] of this.attributeMap) {
      if (!attribute.reserved) {
        this.attributeMap.delete(name);
      }
    }
  }

  ////////////
  // COLORS
  ///////////

  setColorSource(source: ColorSource) {
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

  getColorForNode(nodeSource: NodeSource): string {
    if (this.colorSource === "type") {
      return this.typeColor;
    } else {
      const attribute = this.colorAttribute;
      if (attribute?.type !== "enum") {
        return this.typeColor;
      }

      if (!(attribute.name in nodeSource.attributes)) {
        return this.typeColor;
      }

      const attributeValue = nodeSource.attributes[attribute.name];
      const attributeValueInstance = attribute.valueMap?.get(
        attributeValue as string,
      );
      if (!attributeValueInstance) {
        return this.typeColor;
      }

      return attributeValueInstance.color;
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
          color: attributes.source.color,
        };
      },
    );
  }

  ////////////
  // GLYPHS
  ///////////

  setGlyphSource(source: GlyphSource) {
    if (this.glyphSource === source) return;
    this.glyphSource = source;
    if (this.glyphSource === "type") {
      this.updateNodeGlyphToType();
    } else {
      this.updateNodeGlyphToAttribute();
    }
  }

  setTypeGlyph(glyph: string) {
    const icon = IconMap.get(glyph);
    if (!icon) {
      console.warn(`Icon ${glyph} not found.`);
      return;
    }

    this.typeGlyph = icon;
    if (this.glyphSource === "type") {
      this.updateNodeGlyphToType();
    }
  }

  setGlyphAttribute(attributeName: string) {
    const attribute = this.attributeMap.get(attributeName);
    if (!attribute) {
      console.warn(
        `Attribute ${attributeName} not found for node type ${this.nodeType}`,
      );
      return;
    }

    if (this.glyphAttribute === attribute) return;

    this.glyphAttribute = attribute;
    this.updateNodeGlyphToAttribute();
  }

  getGlyphForNode(nodeSource: NodeSource): string {
    if (this.glyphSource === "type") {
      return this.typeGlyph.url;
    } else {
      const attribute = this.glyphAttribute;
      if (attribute?.type !== "enum") {
        return this.typeGlyph.url;
      }

      if (!(attribute.name in nodeSource.attributes)) {
        return this.typeGlyph.url;
      }

      const attributeValue = nodeSource.attributes[attribute.name];
      const attributeValueInstance = attribute.valueMap?.get(
        attributeValue as string,
      );
      if (!attributeValueInstance?.glyph?.url) {
        return this.typeGlyph.url;
      }

      return attributeValueInstance.glyph.url;
    }
  }

  updateNodeGlyphToType() {
    setPropertiesForNodesOfType(
      this.attributeManager.dataset.appState.sigma,
      this.nodeType,
      {
        image: this.typeGlyph.url,
      },
    );
  }

  updateNodeGlyphToAttribute() {
    const attribute = this.glyphAttribute;
    if (attribute?.type !== "enum") return;

    updatePropertiesForNodesOfType(
      this.attributeManager.dataset.appState.sigma,
      this.nodeType,
      (attributes) => {
        return {
          ...attributes,
          image: this.getGlyphForNode(attributes.source),
        };
      },
    );
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
      "type",
      DEFINES.nodes.Mention.color,
      "type",
      "Mention",
    );
    this.documentProperties = new NodeTypeProperties(
      this,
      "Document",
      "type",
      DEFINES.nodes.Document.color,
      "type",
      "Document",
    );
    this.entityProperties = new NodeTypeProperties(
      this,
      "Entity",
      "type",
      DEFINES.nodes.Entity.color,
      "type",
      "Entity",
    );
    this.nodeProperties.set("Mention", this.mentionProperties);
    this.nodeProperties.set("Document", this.documentProperties);
    this.nodeProperties.set("Entity", this.entityProperties);

    for (const attribute of RESERVED_ATTRIBUTES) {
      this.addAttribute(attribute, true);
    }

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

  addAttribute(attribute: AttributeDB, reserved = false) {
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
        reserved,
      );
      nodeTypeProperties.addAttribute(attributeInstance);
      if (attribute.activeColor) {
        nodeTypeProperties.setColorAttribute(attribute.name);
        nodeTypeProperties.setColorSource("attribute");
      }
      if (attribute.activeGlyph) {
        nodeTypeProperties.setGlyphAttribute(attribute.name);
        nodeTypeProperties.setGlyphSource("attribute");
      }
    });
  }
}
