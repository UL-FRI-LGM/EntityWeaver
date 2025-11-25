import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { action, computed, makeObservable, observable } from "mobx";
import { apply, type RulesLogic } from "json-logic-js";
import { bfsFromNode } from "graphology-traversal";

export abstract class GraphEntity {
  readonly id: string;
  readonly internal_id: string;
  x?: number;
  y?: number;
  dataset: Dataset;

  filtered = false;

  protected constructor(
    internal_id: string,
    id_prefix: string,
    dataset: Dataset,
    x: number | undefined,
    y: number | undefined,
  ) {
    this.internal_id = internal_id;
    this.id = id_prefix + internal_id;
    this.dataset = dataset;
    this.x = x;
    this.y = y;

    makeObservable(this, {
      x: observable,
      y: observable,
      setPosition: action.bound,
      dispose: action.bound,
      canDelete: computed,
    });
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  get canDelete(): boolean {
    return true;
  }

  setPosition(position: { x?: number | null; y?: number | null }) {
    this.x = position.x ?? undefined;
    this.y = position.y ?? undefined;
    if (this.x !== undefined || this.y !== undefined) {
      updateNodeProperties(this.dataset.appState.sigma, this.id, {
        x: this.x,
        y: this.y,
      });
    }
  }

  setFiltered(filtered: boolean) {
    this.filtered = filtered;
  }

  applyFilter(shownIds: Set<string>, jsonRulesLogic: RulesLogic) {
    if (!this.dataset.appState.sigma) {
      return;
    }
    if (shownIds.size > 0 && !shownIds.has(this.id)) {
      return;
    }
    if (jsonRulesLogic === false || apply(jsonRulesLogic, this)) {
      bfsFromNode(
        this.dataset.appState.sigma.getGraph(),
        this.id,
        function (_node, attr, depth) {
          attr.source.setFiltered(true);
          return (
            depth > 0 &&
            (attr.nodeType === "Entity" || attr.nodeType === "Document")
          );
        },
      );
    }
  }

  dispose() {
    if (!this.canDelete) return;
    this.dataset.appState.onNodeDeleted(this.id);
  }
}
