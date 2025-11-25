import { computed, makeAutoObservable } from "mobx";
import { Dataset, type GraphNodeType } from "@/stores/dataset.ts";
import {
  type AttributeDataTypeSchema,
  type AttributeSchema,
  AttributeValueSchema,
} from "@/utils/schemas.ts";
import { z } from "zod";
import type { Field, RuleGroupType } from "react-querybuilder";

export type AttributeDB = z.output<typeof AttributeSchema>;
export type AttributeValueDB = z.output<typeof AttributeValueSchema>;

export type AttributeDataType = z.output<typeof AttributeDataTypeSchema>;

export class AttributeValue {
  name: string;
  label: string | undefined;

  constructor(name: string, label?: string) {
    this.name = name;
    this.label = label;

    makeAutoObservable(this);
  }

  toJson(): AttributeValueDB {
    return {
      name: this.name,
      label: this.label,
    };
  }

  static fromJson(attributeValue: AttributeValueDB) {
    if (typeof attributeValue === "string") {
      return new AttributeValue(attributeValue);
    }
    return new AttributeValue(attributeValue.name, attributeValue.label);
  }
}

export class Attribute {
  name: string;
  label: string | undefined;
  type: AttributeDataType;
  records: GraphNodeType[] = [];
  values: AttributeValue[] | undefined;

  constructor(
    name: string,
    type: AttributeDataType,
    records: GraphNodeType[],
    label?: string,
    values?: AttributeValue[],
  ) {
    this.name = name;
    this.type = type;
    this.records = records;
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
      records: this.records,
      label: this.label,
      values: this.values?.map((value) => value.toJson()),
    };
  }

  static fromJson(attribute: AttributeDB): Attribute {
    return new Attribute(
      attribute.name,
      attribute.type,
      attribute.records,
      attribute.label,
      attribute.values?.map((value) => AttributeValue.fromJson(value)),
    );
  }
}

export class FilterSequence {
  filterManager: FilterManager;

  filterBy: GraphNodeType;

  query: RuleGroupType = { combinator: "and", rules: [] };

  constructor(filterManager: FilterManager, filterBy: GraphNodeType) {
    this.filterManager = filterManager;
    this.filterBy = filterBy;

    makeAutoObservable(this, { filterManager: false }, { autoBind: true });
  }

  setQuery(query: RuleGroupType) {
    this.query = query;
  }

  get potentialAttributes() {
    return this.filterManager.attributes.get(this.filterBy) ?? [];
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
