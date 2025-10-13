import type Sigma from "sigma";
import { Dataset, type GraphNodeType } from "@/stores/dataset.ts";
import { UiState } from "@/stores/uiState.ts";
import { createContext, use } from "react";
import { makeAutoObservable } from "mobx";
import { Mention } from "@/stores/mention.ts";
import { Document } from "@/stores/document.ts";
import { Entity } from "@/stores/entity.ts";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import {
  assignRandomPositions,
  computeLayoutContribution,
  restoreEdgeProperties,
  updateEdgeProperties,
  updateEntityViewEdges,
  updateGraph,
  updateNodeProperties,
} from "@/utils/graphHelpers.ts";
import { DEFINES } from "@/defines.ts";
import type { AnimateOptions } from "sigma/utils";
import { configurePersistable } from "mobx-persist-store";

configurePersistable(
  {
    storage: window.localStorage,
  },
  { delay: 200 },
);

export type ConnectionType =
  | "MentionToDocument"
  | "MentionToEntity"
  | "EntityToDocument"
  | "MentionCollocation"
  | "EntityCollocation";

export interface NodeType {
  x?: number;
  y?: number;
  label: string;
  size: number;
  color: string;
  highlighted?: boolean;
  borderColor?: string;
  borderSize?: number;
  hidden?: boolean;
  image: string;
  pictogramColor: string;
  type: string;
  nodeType: GraphNodeType;
  entityType?: string;
  zIndex?: number;

  source: Entity | Document | Mention;
}
export interface EdgeType {
  size: number;
  color: string;
  connectionType: ConnectionType;
  hidden?: boolean;
  zIndex?: number;
  layoutWeight?: number;
}

export type SigmaGraph = Sigma<NodeType, EdgeType>;

export class AppState {
  dataset: Dataset = new Dataset(this);
  uiState: UiState = new UiState(this);
  sigma: SigmaGraph | null = null;

  deleteNodeModalOpen = false;
  selectedNode: string | null = null;
  selectedEdge: string | null = null;
  hoveredNode: string | null = null;
  hoveredEdge: string | null = null;
  uiHoveredNode: string | null = null;
  focusedNode: string | null = null;
  holdingShift = false;
  loadingData = false;
  initialLayout = false;
  forceAtlasLayout: any = null;
  noOverlapLayout: any = null;
  atlasLayoutInProgress = false;
  noverlapLayoutInProgress = false;

  constructor() {
    makeAutoObservable(this);
  }

  get selectedNodeInstance() {
    if (!this.selectedNode) return undefined;
    return this.sigma?.getGraph().getNodeAttributes(this.selectedNode).source;
  }

  get graphLoading() {
    return (
      this.loadingData || this.dataset.fetchingData || this.isLayoutInProgress
    );
  }
  get isLayoutInProgress() {
    return this.atlasLayoutInProgress || this.noverlapLayoutInProgress;
  }

  setSigma(sigma: SigmaGraph) {
    this.sigma = sigma;
    this.forceAtlasLayout = new FA2Layout<NodeType, EdgeType>(
      sigma.getGraph(),
      {
        settings: { slowDown: 10, gravity: 0, scalingRatio: 0.001 },
        getEdgeWeight: (_edge, attributes) => {
          return attributes.layoutWeight ?? 0;
        },
      },
    );
    this.runGraphUpdate(false);
    // this.noOverlapLayout = new NoverlapLayout(this.sigma.getGraph(), {
    //   inputReducer: (key, attr) => ({
    //     x: attr.x,
    //     y: attr.y,
    //     size: attr.size,
    //   }),
    //   settings: { margin: 0, ratio: 0.2 },
    // });
  }
  setDeleteNodeModalOpen(state: boolean) {
    this.deleteNodeModalOpen = state && this.selectedNode !== null;
  }
  setSelectedNode(nodeId: string | null) {
    if (nodeId === this.selectedNode) return;
    if (this.selectedNode && this.selectedNode !== this.uiHoveredNode) {
      updateNodeProperties(this.sigma, this.selectedNode, {
        borderColor: undefined,
      });
    }
    this.setSelectedEdge(null);
    this.selectedNode = nodeId;
    if (nodeId) {
      updateNodeProperties(this.sigma, nodeId, {
        borderColor: DEFINES.selection.borderColor,
      });
    }
    this.setUiHoveredNode(null);
  }
  setSelectedEdge(edgeId: string | null) {
    if (edgeId === this.selectedEdge) return;
    if (this.selectedEdge && this.sigma) {
      restoreEdgeProperties(this.sigma, this.selectedEdge);
    }
    this.setSelectedNode(null);
    this.selectedEdge = edgeId;
    if (edgeId && this.sigma) {
      updateEdgeProperties(this.sigma, edgeId, {
        color: DEFINES.selection.edgeColor,
      });
    }
  }
  setHoveredNode(nodeId: string | null) {
    this.hoveredNode = nodeId;
  }
  setHoveredEdge(edgeId: string | null) {
    this.hoveredEdge = edgeId;
  }
  setUiHoveredNode(nodeId: string | null) {
    if (
      this.uiHoveredNode &&
      nodeId === null &&
      this.uiHoveredNode !== this.selectedNode
    ) {
      updateNodeProperties(this.sigma, this.uiHoveredNode, {
        borderColor: undefined,
      });
    }
    this.uiHoveredNode = nodeId;
    if (nodeId && this.uiHoveredNode !== this.selectedNode) {
      updateNodeProperties(this.sigma, nodeId, {
        borderColor: DEFINES.uiHover.borderColor,
      });
    }
  }
  setFocusedNode(nodeId: string | null) {
    if (nodeId !== null && this.focusedNode !== this.selectedNode) {
      this.setSelectedNode(nodeId);
    }

    this.focusedNode = nodeId;
  }
  setEntityView(state: boolean) {
    this.uiState.entityView = state;
    if (state) {
      updateEntityViewEdges(this.sigma, this.dataset);
    }
  }
  clearGraphState() {
    this.selectedNode = null;
    this.hoveredNode = null;
    this.uiHoveredNode = null;
  }
  runGraphUpdate(runLayout = true) {
    if (this.sigma) {
      this.clearGraphState();
      if (!this.dataset.hasData) {
        return;
      }
      updateGraph(this.sigma, this.dataset, this.uiState.colorByType);
      if (this.uiState.entityView) {
        updateEntityViewEdges(this.sigma, this.dataset);
      }
      this.sigma.getCamera().animatedReset().catch(console.error);
      if (runLayout) {
        this.runLayout();
        this.initialLayout = true;
      }
    }
  }
  runLayout() {
    if (!this.forceAtlasLayout || this.forceAtlasLayout.isRunning()) {
      return;
    }
    if (this.sigma) {
      computeLayoutContribution(this.sigma);
      assignRandomPositions(this.sigma);
    }
    this.atlasLayoutInProgress = true;
    this.forceAtlasLayout.start();

    setTimeout(() => {
      this.stopAtlasLayout();
    }, DEFINES.layoutRuntimeInMs);
  }
  stopAtlasLayout() {
    if (!this.forceAtlasLayout?.isRunning()) {
      this.atlasLayoutInProgress = false;
      return;
    }
    this.forceAtlasLayout.stop();
    this.atlasLayoutInProgress = false;
    this.sigma?.getGraph().forEachNode((_nodeId, attr) => {
      attr.source.setPosition(attr);
    });

    if (this.noOverlapLayout) {
      this.noverlapLayoutInProgress = true;
      this.noOverlapLayout?.start();
      setTimeout(() => {
        this.stopNoverlapLayout();
      }, DEFINES.layoutRuntimeInMs);
    }
  }
  stopNoverlapLayout() {
    if (!this.noOverlapLayout?.isRunning()) {
      this.noverlapLayoutInProgress = false;
      return;
    }
    this.noOverlapLayout.stop();
    this.sigma?.getGraph().forEachNode((_node, attributes) => {
      attributes.source.setPosition(attributes);
    });
    this.noverlapLayoutInProgress = false;
    this.initialLayout = false;
  }
  setHoldingShift(state: boolean) {
    this.holdingShift = state;
  }
  setHighlightOnSelect(state: boolean) {
    this.uiState.highlightOnSelect = state;
  }
  setHighlightOnHover(state: boolean) {
    this.uiState.highlightOnHover = state;
  }
  resetCamera(options: Partial<AnimateOptions> = { duration: 1 }) {
    const camera = this.sigma?.getCamera();
    camera?.animatedReset(options).catch(console.error);
  }
  onNodeDeleted(nodeId: string) {
    if (nodeId === this.selectedNode) {
      this.setSelectedNode(null);
    }
    if (nodeId === this.selectedNode) {
      this.setHoveredNode(null);
    }
    this.sigma?.getGraph().dropNode(nodeId);
  }
  deleteEdge(edgeId: string) {
    if (!this.sigma) {
      return;
    }

    const graph = this.sigma.getGraph();
    const attributes = graph.getEdgeAttributes(edgeId);
    if (attributes.connectionType === "MentionToEntity") {
      if (this.selectedEdge === edgeId) {
        this.setSelectedEdge(null);
      }
      if (this.hoveredNode === edgeId) {
        this.setHoveredEdge(null);
      }
      const mentionId = graph.source(edgeId);
      const entityId = graph.target(edgeId);
      const mention = this.dataset.mentions.get(mentionId);
      mention?.removeEntityLink(entityId);
    }
  }
}

// const savedUiState = loadFromLocalStorage<UiStateSnapShotIn>(
//   DEFINES.uiStateStorageKey,
//   {},
// );
const initialState = new AppState();
// onSnapshot(initialState.uiState, (snapshot) => {
//   storeInLocalStorage(DEFINES.uiStateStorageKey, snapshot);
// });

export const appState = initialState;

const AppStateContext = createContext<null | AppState>(null);

export const AppStateProvider = AppStateContext.Provider;
export function useAppState() {
  const store = use(AppStateContext);
  if (store === null) {
    throw new Error("Store cannot be null, please add a context provider");
  }
  return store;
}
