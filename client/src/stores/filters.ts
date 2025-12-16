import { computed, makeAutoObservable } from "mobx";
import { Dataset, type GraphNodeType } from "@/stores/dataset.ts";
import type { RuleGroupType } from "react-querybuilder";
import { v4 as uuidv4 } from "uuid";
import type { AttributeManager } from "@/stores/nodeAttributes.ts";

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
    return (
      this.filterManager.attributeManager.nodeProperties.get(this.filterBy)
        ?.attributes ?? []
    );
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
  attributeManager: AttributeManager;

  constructor(dataset: Dataset, attributeManager: AttributeManager) {
    this.filterSequences = [new FilterSequence(this, "Mention")];
    makeAutoObservable(this, {
      dataset: false,
      attributeManager: false,
    });

    this.dataset = dataset;
    this.attributeManager = attributeManager;
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
