import { updateNodeProperties } from "@/utils/graphHelpers.ts";
import type { Dataset } from "@/stores/dataset.ts";
import { makeObservable } from "mobx";
import { apply, type RulesLogic } from "json-logic-js";
import { bfsFromNode } from "graphology-traversal";
import type { GraphNodeType } from "@/utils/schemas.ts";

export abstract class GraphEntity {
  readonly id: string;
  readonly internal_id: string;
  x?: number;
  y?: number;
  dataset: Dataset;

  nodeType: GraphNodeType;
  filtered = false;
  unfilteredConnections = 0;

  protected constructor(
    internal_id: string,
    id_prefix: string,
    dataset: Dataset,
    x: number | undefined,
    y: number | undefined,
    nodeType: GraphNodeType,
  ) {
    this.internal_id = internal_id;
    this.id = id_prefix + internal_id;
    this.dataset = dataset;
    this.x = x;
    this.y = y;

    this.nodeType = nodeType;

    makeObservable(this, {
      x: true,
      y: true,
      setPosition: true,
      dispose: true,
      canDelete: true,
    });

    const attributeMap =
      this.dataset.attributeManager.nodeProperties.get(nodeType)?.attributeMap;

    if (!attributeMap) {
      throw new Error(`No attribute map found for node type ${nodeType}`);
    }
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

  removeFilter() {
    this.setFiltered(false);
    this.unfilteredConnections = 0;
  }

  applyFilter(
    showsIds: Set<string>,
    attributeFilter: RulesLogic,
    excluding: boolean,
  ) {
    if (!this.dataset.appState.sigma) {
      return;
    }

    if (excluding && !this.filtered) {
      return;
    }

    const hidden = showsIds.size > 0 && !showsIds.has(this.id);
    const filtered =
      hidden || (attributeFilter !== false && !apply(attributeFilter, this));

    if ((!excluding && filtered) || (excluding && !filtered)) {
      return;
    }

    bfsFromNode(
      this.dataset.appState.sigma.getGraph(),
      this.id,
      function (_node, attr, depth) {
        if (!excluding) {
          attr.source.setFiltered(true);
          if (depth > 0) {
            attr.source.unfilteredConnections++;
          }
        } else {
          if (depth === 0 || attr.source.unfilteredConnections === 0) {
            attr.source.setFiltered(false);
            attr.source.unfilteredConnections = 0;
          } else {
            attr.source.unfilteredConnections--;
            if (attr.source.unfilteredConnections < 1) {
              attr.source.setFiltered(false);
            }
          }
        }
        return (
          depth > 0 &&
          (attr.source.nodeType === "Entity" ||
            attr.source.nodeType === "Document")
        );
      },
    );
  }

  dispose() {
    if (!this.canDelete) return;
    this.dataset.appState.onNodeDeleted(this.id);
  }
}
