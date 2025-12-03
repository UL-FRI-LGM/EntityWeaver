import { computed, makeAutoObservable } from "mobx";
import { Dataset, type GraphNodeType } from "@/stores/dataset.ts";
import {
  type AttributeDataTypeSchema,
  type AttributeSchema,
  AttributeValueSchema,
} from "@/utils/schemas.ts";
import { z } from "zod";
import type { Field, RuleGroupType } from "react-querybuilder";
import { v4 as uuidv4 } from "uuid";
import { DEFINES } from "@/defines.ts";

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

const defaultQuery = { combinator: "and", rules: [] };

export class FilterSequence {
  id: string;

  filterManager: FilterManager;

  filterBy: GraphNodeType;
  includedIds: string[] = [];

  query: RuleGroupType = structuredClone(defaultQuery);

  constructor(filterManager: FilterManager, filterBy: GraphNodeType) {
    this.id = uuidv4();

    this.filterManager = filterManager;
    this.filterBy = filterBy;

    makeAutoObservable(
      this,
      {
        id: false,
        filterManager: false,
        potentialAttributes: computed({ keepAlive: true }),
      },
      { autoBind: true },
    );
  }

  setQuery(query: RuleGroupType) {
    this.query = query;
  }

  get potentialAttributes() {
    return this.filterManager.attributes.get(this.filterBy) ?? [];
  }

  setIncludedIds(ids: string[]) {
    this.includedIds = ids;
  }

  setFilterBy(filterBy: GraphNodeType) {
    this.filterBy = filterBy;
    this.setQuery(structuredClone(defaultQuery));
    this.setIncludedIds([]);
  }

  get dataList() {
    if (this.filterBy === "Mention") {
      return this.filterManager.dataset.mentionList;
    } else if (this.filterBy === "Entity") {
      return this.filterManager.dataset.entityList;
    } else {
      return this.filterManager.dataset.documentList;
    }
  }
}

export class FilterManager {
  filterSequences: FilterSequence[];
  selectedFilterIndex = 0;

  dataset: Dataset;

  typeColors: Map<GraphNodeType, string> = new Map<GraphNodeType, string>([
    ["Document", DEFINES.nodes.Document.color],
    ["Mention", DEFINES.nodes.Mention.color],
    ["Entity", DEFINES.nodes.Entity.color],
  ]);

  attributes: Map<GraphNodeType, Attribute[]> = new Map<
    GraphNodeType,
    Attribute[]
  >();

  constructor(dataset: Dataset) {
    this.filterSequences = [new FilterSequence(this, "Mention")];
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

  clearAttributes() {
    this.attributes.clear();
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

  addFilterSequence(filterBy: GraphNodeType) {
    this.filterSequences.push(new FilterSequence(this, filterBy));
    this.selectedFilterIndex = this.filterSequences.length - 1;
  }

  removeFilterSequence(index: number) {
    const filterSequence = this.filterSequences[index];
    this.filterSequences.splice(index, 1);
    if (this.filterSequences.length === 0) {
      this.filterSequences.push(
        new FilterSequence(this, filterSequence.filterBy),
      );
    } else {
      this.selectedFilterIndex = Math.min(
        this.selectedFilterIndex,
        this.filterSequences.length - 1,
      );
    }
  }

  get selectedFilter() {
    if (
      this.filterSequences.length === 0 ||
      this.selectedFilterIndex >= this.filterSequences.length
    )
      return undefined;
    return this.filterSequences[this.selectedFilterIndex];
  }

  setSelectedFilterIndex(index: number) {
    this.selectedFilterIndex = index;
  }
}
