import { makeAutoObservable } from "mobx";
import { v4 as uuiv4 } from "uuid";
import { Dataset, type GraphNodeType } from "@/stores/dataset.ts";
import {
  type AttributeDataTypeSchema,
  type AttributeSchema,
  AttributeValueSchema,
} from "@/utils/schemas.ts";
import { z } from "zod";

export type AttributeDB = z.output<typeof AttributeSchema>;
export type AttributeValueDB = z.output<typeof AttributeValueSchema>;

export const Operator = {
  AND: "AND",
  OR: "OR",
} as const;

export type OperatorType = keyof typeof Operator;

export type AttributeDataType = z.output<typeof AttributeDataTypeSchema>;

export class AttributeValue {
  name: string;
  text: string | undefined;

  constructor(name: string, text?: string) {
    this.name = name;
    this.text = text;

    makeAutoObservable(this);
  }

  toJson(): AttributeValueDB {
    return {
      name: this.name,
      text: this.text,
    };
  }

  static fromJson(attributeValue: AttributeValueDB) {
    if (typeof attributeValue === "string") {
      return new AttributeValue(attributeValue);
    }
    return new AttributeValue(attributeValue.name, attributeValue.text);
  }
}

export class Attribute {
  name: string;
  type: AttributeDataType;
  records: GraphNodeType[] = [];
  values: AttributeValue[] | undefined;

  constructor(
    name: string,
    type: AttributeDataType,
    records: GraphNodeType[],
    values?: AttributeValue[],
  ) {
    this.name = name;
    this.type = type;
    this.records = records;
    this.values = values;

    makeAutoObservable(this);
  }

  toJson(): AttributeDB {
    return {
      name: this.name,
      type: this.type,
      records: this.records,
      values: this.values?.map((value) => value.toJson()),
    };
  }

  static fromJson(attribute: AttributeDB): Attribute {
    return new Attribute(
      attribute.name,
      attribute.type,
      attribute.records,
      attribute.values?.map((value) => AttributeValue.fromJson(value)),
    );
  }
}

// const defaultMentionAttributes: Attribute[] = [
//   new Attribute("type", "string"),
//   new Attribute("name", "string"),
// ];
//
// const defaultEntityAttributes: Attribute[] = [
//   new Attribute("type", "string"),
//   new Attribute("name", "string"),
// ];
//
// const defaultDocumentAttributes: Attribute[] = [
//   new Attribute("title", "string"),
// ];

export class FilterInstance {
  attribute: Attribute | null;
  filterValue: string;
  operator: OperatorType;

  id: string;
  filterSequence: FilterSequence;

  constructor(
    filterSequence: FilterSequence,
    attribute: Attribute | null = null,
    filterValue = "",
    operator: OperatorType = "AND",
  ) {
    this.attribute = attribute;
    this.operator = operator;
    this.filterValue = filterValue;

    this.id = uuiv4();
    this.filterSequence = filterSequence;

    makeAutoObservable(this, { id: false, filterSequence: false });
  }

  setAttribute(attribute: Attribute) {
    this.attribute = attribute;
  }

  setFilterValue(filterValue: string) {
    this.filterValue = filterValue;
  }

  setOperator(operator: OperatorType) {
    this.operator = operator;
  }
}

export class FilterSequence {
  filterManager: FilterManager;

  filterBy: GraphNodeType;

  filters: FilterInstance[];

  constructor(filterManager: FilterManager, filterBy: GraphNodeType) {
    this.filterManager = filterManager;
    this.filterBy = filterBy;
    this.filters = [new FilterInstance(this, null, "", "AND")];

    makeAutoObservable(this, { filterManager: false });
  }

  addFilter(filter?: FilterInstance) {
    this.filters.push(filter ?? new FilterInstance(this));
  }

  removeFilter(filter: FilterInstance) {
    this.filters = this.filters.filter((f) => f !== filter);
  }

  get potentialAttributes() {
    return this.filterManager.attributes.get(this.filterBy) ?? [];
  }

  getAttributeByName(name: string): Attribute | null {
    const attribute = this.potentialAttributes.find(
      (attr) => attr.name === name,
    );
    return attribute ?? null;
  }
}

export class FilterManager {
  filterSequence: FilterSequence;

  dataset: Dataset;

  attributes: Map<GraphNodeType, Attribute[]> = new Map<
    GraphNodeType,
    Attribute[]
  >();

  constructor(dataset: Dataset) {
    this.filterSequence = new FilterSequence(this, "Mention");
    makeAutoObservable(this, {
      dataset: false,
    });

    this.dataset = dataset;
  }

  toJson(): AttributeDB[] {
    return [...new Set(Array.from(this.attributes.values()).flat())].map(
      (attribute) => attribute.toJson(),
    );
  }

  static fromJson(dataset: Dataset, attributes: AttributeDB[]) {
    const filterManager = new FilterManager(dataset);
    attributes.forEach((attribute) => {
      filterManager.addAttribute(attribute);
    });
    return filterManager;
  }

  addAttribute(attribute: AttributeDB) {
    const attributeInstance = Attribute.fromJson(attribute);
    attribute.records.forEach((recordType) => {
      let attributeList = this.attributes.get(recordType);
      if (!attributeList) {
        this.attributes.set(recordType, []);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        attributeList = this.attributes.get(recordType)!;
      }
      attributeList.push(attributeInstance);
    });
  }
}
