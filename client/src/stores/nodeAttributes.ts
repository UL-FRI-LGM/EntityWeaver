import { Dataset } from "@/stores/dataset.ts";
import { computed, makeAutoObservable, observable } from "mobx";
import {
  type AttributeDataType,
  type AttributeDB,
  type AttributeValueDB,
  type GraphNodeType,
} from "@/utils/schemas.ts";
import type { Field } from "react-querybuilder";
import {
  DefaultNumberAttributeStops,
  DEFINES,
  RESERVED_ATTRIBUTES,
} from "@/defines.ts";
import type { NodeSource } from "@/stores/appState.ts";
import { defaultIcon, type Icon, IconMap } from "@/utils/iconsHelper.tsx";
import { getDefaultColor, valueToGradientColor } from "@/utils/helpers.ts";
import { v4 as uuidv4 } from "uuid";
import { redrawNodesOfType } from "@/utils/graphHelpers.ts";
import { GradientStopsHandler } from "@/stores/gradientStopsHandler.ts";

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
      this.attribute.nodeTypeProperties.redrawNodes();
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
      this.attribute.nodeTypeProperties.redrawNodes();
    }
  }
}

export class Attribute {
  id: string;
  name: string;
  label: string | undefined;
  type: AttributeDataType;
  valueMap: Map<string, AttributeValue> | undefined;
  gradientStopsHandler: GradientStopsHandler | undefined;

  // Only needed for number attributes, but let's just assume everything has it for simplicity
  min = 0;
  max = 1;

  nodeTypeProperties: NodeTypeProperties;

  // Prevents deletion
  reserved: boolean;

  constructor(
    nodeTypeProperties: NodeTypeProperties,
    name: string,
    type: AttributeDataType,
    {
      label,
      min = 0,
      max = 1,
      reserved = false,
    }: {
      label?: string;
      min?: number;
      max?: number;
      reserved?: boolean;
    } = {},
  ) {
    this.id = uuidv4();
    this.name = name;
    this.type = type;
    this.label = label;
    this.min = min;
    this.max = max;

    if (type === "number") {
      this.gradientStopsHandler = new GradientStopsHandler({
        usesVisibilityComponent: false,
        stops: DefaultNumberAttributeStops,
        onChange: () => {
          if (
            this.nodeTypeProperties.colorSource === "attribute" &&
            this.nodeTypeProperties.colorAttribute === this
          ) {
            this.nodeTypeProperties.redrawNodes();
          }
        },
      });
    }

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
      (this.type === "enum" &&
        this.valueMap !== undefined &&
        this.valueMap.size > 1) ||
      (this.type === "number" && this.gradientStopsHandler !== undefined)
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
    const base = {
      name: this.name,
      records: [this.nodeTypeProperties.nodeType],
      activeColor: this.nodeTypeProperties.colorAttribute === this,
      activeGlyph: this.nodeTypeProperties.glyphAttribute === this,
      label: this.label,
    };
    if (this.type === "enum") {
      return {
        ...base,
        type: "enum",
        values: this.values?.map((value) => value.toJson()),
      };
    }
    if (this.type === "number") {
      return {
        ...base,
        type: "number",
        min: 0,
        max: 0,
      };
    }
    return {
      ...base,
      type: this.type,
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
      { label: attribute.label, reserved: reserved },
    );
    if (attribute.type === "enum" && attribute.values) {
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
      attributes: computed({ keepAlive: true }),
      nonReservedAttributes: computed({ keepAlive: true }),
      attributeMap: observable.shallow,
      redrawNodes: false,
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
    if (this.colorAttribute === undefined && attribute.isValidColorAttribute) {
      this.setColorAttribute(attribute.name);
    }
    if (this.glyphAttribute === undefined && attribute.isValidGlyphAttribute) {
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

  redrawNodes() {
    redrawNodesOfType(
      this.attributeManager.dataset.appState.sigma,
      this.nodeType,
    );
  }

  ////////////
  // COLORS
  ///////////

  setColorSource(source: ColorSource) {
    if (this.colorSource === source) return;

    this.colorSource = source;

    this.redrawNodes();
  }

  setTypeColor(color: string) {
    this.typeColor = color;

    if (this.colorSource === "type") {
      this.redrawNodes();
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
    this.redrawNodes();
  }

  getColorForNode(nodeSource: NodeSource): string {
    if (this.colorSource === "type") {
      return this.typeColor;
    } else {
      const attribute = this.colorAttribute;
      if (!attribute) {
        return this.typeColor;
      }

      if (attribute.type === "enum") {
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

      if (attribute.type === "number") {
        if (!(attribute.name in nodeSource.attributes)) {
          return this.typeColor;
        }

        if (
          !attribute.gradientStopsHandler ||
          attribute.gradientStopsHandler.stops.length === 0
        ) {
          return this.typeColor;
        }

        const attributeValue = Number(nodeSource.attributes[attribute.name]);
        if (isNaN(attributeValue)) {
          return this.typeColor;
        }

        const scaledValue =
          (attributeValue - attribute.min) / (attribute.max - attribute.min);

        const color = valueToGradientColor(
          attribute.gradientStopsHandler,
          scaledValue,
        );

        return color.hex();
      }

      return this.typeColor;
    }
  }

  ////////////
  // GLYPHS
  ///////////

  setGlyphSource(source: GlyphSource) {
    if (this.glyphSource === source) return;
    this.glyphSource = source;
    this.redrawNodes();
  }

  setTypeGlyph(glyph: string) {
    const icon = IconMap.get(glyph);
    if (!icon) {
      console.warn(`Icon ${glyph} not found.`);
      return;
    }

    this.typeGlyph = icon;
    if (this.glyphSource === "type") {
      this.redrawNodes();
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
    this.redrawNodes();
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
