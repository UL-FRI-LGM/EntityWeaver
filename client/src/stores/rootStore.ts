import { createContext, use } from "react";
import {
  types,
  type Instance,
  getRoot,
  type SnapshotIn,
  onSnapshot,
} from "mobx-state-tree";
import type Sigma from "sigma";
import {
  assignRandomPositions,
  computeLayoutContribution,
  restoreEdgeProperties,
  setColorByType,
  updateEdgeProperties,
  updateEntityViewEdges,
  updateGraph,
  updateNodeProperties,
} from "@/utils/graphHelpers.ts";
import type { AnimateOptions } from "sigma/utils";
import {
  Dataset,
  type DatasetSnapShotIn,
  type GraphNodeType,
} from "@/stores/dataset.ts";
import { mentionPrefix } from "@/stores/mention.ts";
import { documentPrefix } from "@/stores/document.ts";
import { entityPrefix } from "@/stores/entity.ts";
import { DEFINES } from "@/defines.ts";
import { loadFromLocalStorage, storeInLocalStorage } from "@/utils/helpers.ts";
import FA2Layout from "graphology-layout-forceatlas2/worker";

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
}
export interface EdgeType {
  size: number;
  color: string;
  connectionType: ConnectionType;
  hidden?: boolean;
  zIndex?: number;
  layoutWeight?: number;
}

const Filters = types
  .model({
    entities: types.optional(types.boolean, true),
    documents: types.optional(types.boolean, true),
    mentions: types.optional(types.boolean, true),
    people: types.optional(types.boolean, true),
    locations: types.optional(types.boolean, true),
    organizations: types.optional(types.boolean, true),
    miscellaneous: types.optional(types.boolean, true),
    collocations: types.optional(types.boolean, false),
  })
  .actions((self) => ({
    setEntities(state: boolean) {
      self.entities = state;
    },
    setDocuments(state: boolean) {
      self.documents = state;
    },
    setMentions(state: boolean) {
      self.mentions = state;
    },
    setPeople(state: boolean) {
      self.people = state;
    },
    setLocations(state: boolean) {
      self.locations = state;
    },
    setOrganizations(state: boolean) {
      self.organizations = state;
    },
    setMiscellaneous(state: boolean) {
      self.miscellaneous = state;
    },
    setCollocations(state: boolean) {
      self.collocations = state;
    },
  }));

const UiState = types
  .model({
    highlightOnSelect: types.optional(types.boolean, true),
    highlightOnHover: types.optional(types.boolean, true),
    entityView: types.optional(types.boolean, false),
    colorByType: types.optional(types.boolean, false),
    filters: types.optional(Filters, {}),
  })
  .views((self) => ({
    get sigma(): Sigma<NodeType, EdgeType> | null {
      const rootStore = getRoot(self) as RootInstance;
      return rootStore.sigma;
    },
  }))
  .actions((self) => ({
    setColorByType(state: boolean) {
      self.colorByType = state;
      setColorByType(self.sigma, state);
    },
  }));

export interface UiStateInstance extends Instance<typeof UiState> {}
export interface UiStateSnapShotIn extends SnapshotIn<typeof UiState> {}

const RootStore = types
  .model({
    dataset: types.optional(Dataset, {}),
    uiState: types.optional(UiState, {}),
  })
  .volatile(() => ({
    sigma: null as Sigma<NodeType, EdgeType> | null,
    deleteNodeModalOpen: false,
    selectedNode: null as string | null,
    selectedEdge: null as string | null,
    hoveredNode: null as string | null,
    hoveredEdge: null as string | null,
    uiHoveredNode: null as string | null,
    focusedNode: null as string | null,
    holdingShift: false,
    loadingData: false,
    initialLayout: false,
    forceAtlasLayout: null as FA2Layout<NodeType, EdgeType> | null,
    isLayoutInProgress: false,
  }))
  .views((self) => ({
    get selectedNodeInstance() {
      if (!self.selectedNode) return null;
      if (self.selectedNode.startsWith(mentionPrefix)) {
        return self.dataset.mentions.get(self.selectedNode);
      } else if (self.selectedNode.startsWith(documentPrefix)) {
        return self.dataset.documents.get(self.selectedNode);
      } else if (self.selectedNode.startsWith(entityPrefix)) {
        return self.dataset.entities.get(self.selectedNode);
      } else {
        return null;
      }
    },
    get graphLoading() {
      return (
        self.loadingData || self.dataset.fetchingData || self.isLayoutInProgress
      );
    },
  }))
  .actions((self) => ({
    setLoadingData(state: boolean) {
      self.loadingData = state;
    },
    setUiState(uiState: UiStateSnapShotIn) {
      self.uiState = UiState.create(uiState);
    },
    setDataset(dataset: DatasetSnapShotIn) {
      self.dataset = Dataset.create(dataset);
      this.runGraphUpdate(false);
    },
    setSigma(sigma: Sigma<NodeType, EdgeType>) {
      self.sigma = sigma;
      self.forceAtlasLayout = new FA2Layout<NodeType, EdgeType>(
        self.sigma.getGraph(),
        {
          settings: { slowDown: 10, gravity: 0.5 },
          getEdgeWeight: (_edge, attributes) => {
            return attributes.layoutWeight ?? 0;
          },
        },
      );
    },
    setDeleteNodeModalOpen(state: boolean) {
      self.deleteNodeModalOpen = state && self.selectedNode !== null;
    },
    setSelectedNode(nodeId: string | null) {
      if (nodeId === self.selectedNode) return;
      if (self.selectedNode) {
        updateNodeProperties(self.sigma, self.selectedNode, {
          borderColor: undefined,
        });
      }
      this.setSelectedEdge(null);
      self.selectedNode = nodeId;
      if (nodeId) {
        updateNodeProperties(self.sigma, nodeId, {
          borderColor: DEFINES.selection.borderColor,
        });
      }
      this.setUiHoveredNode(null);
    },
    setSelectedEdge(edgeId: string | null) {
      if (edgeId === self.selectedEdge) return;
      if (self.selectedEdge && self.sigma) {
        restoreEdgeProperties(self.sigma, self.selectedEdge);
      }
      this.setSelectedNode(null);
      self.selectedEdge = edgeId;
      if (edgeId && self.sigma) {
        updateEdgeProperties(self.sigma, edgeId, {
          color: DEFINES.selection.edgeColor,
        });
      }
    },
    setHoveredNode(nodeId: string | null) {
      self.hoveredNode = nodeId;
    },
    setHoveredEdge(edgeId: string | null) {
      self.hoveredEdge = edgeId;
    },
    setUiHoveredNode(nodeId: string | null) {
      if (self.uiHoveredNode && nodeId === null) {
        updateNodeProperties(self.sigma, self.uiHoveredNode, {
          borderColor: undefined,
        });
      }
      self.uiHoveredNode = nodeId;
      if (nodeId) {
        updateNodeProperties(self.sigma, nodeId, {
          borderColor: DEFINES.uiHover.borderColor,
        });
      }
    },
    setFocusedNode(nodeId: string | null) {
      if (nodeId !== null && self.focusedNode !== self.selectedNode) {
        this.setSelectedNode(nodeId);
      }

      self.focusedNode = nodeId;
    },
    setEntityView(state: boolean) {
      self.uiState.entityView = state;
      if (state) {
        updateEntityViewEdges(self.sigma, self.dataset);
      }
    },
    clearGraphState() {
      self.selectedNode = null;
      self.hoveredNode = null;
      self.uiHoveredNode = null;
    },

    onDatasetUpdate() {
      this.runGraphUpdate();
    },
    runGraphUpdate(runLayout = true) {
      if (self.sigma) {
        this.clearGraphState();
        updateGraph(self.sigma, self.dataset, self.uiState.colorByType);
        if (self.uiState.entityView) {
          updateEntityViewEdges(self.sigma, self.dataset);
        }
        self.sigma.getCamera().animatedReset().catch(console.error);
        if (runLayout) {
          this.runLayout();
          self.initialLayout = true;
        }
      }
    },
    runLayout() {
      if (!self.forceAtlasLayout || self.forceAtlasLayout.isRunning()) {
        return;
      }
      if (self.sigma) {
        computeLayoutContribution(self.sigma);
        assignRandomPositions(self.sigma);
      }
      self.isLayoutInProgress = true;
      self.forceAtlasLayout.start();

      setTimeout(() => {
        this.stopLayout();
      }, DEFINES.layoutRuntimeInMs);
    },
    stopLayout() {
      if (!self.forceAtlasLayout?.isRunning()) {
        return;
      }
      self.forceAtlasLayout.stop();
      self.isLayoutInProgress = false;
      self.sigma?.getGraph().forEachNode((node, attributes) => {
        self.dataset.setNodePosition(node, attributes.nodeType, attributes);
      });
      self.initialLayout = false;
    },
    setHoldingShift(state: boolean) {
      self.holdingShift = state;
    },
    setHighlightOnSelect(state: boolean) {
      self.uiState.highlightOnSelect = state;
    },
    setHighlightOnHover(state: boolean) {
      self.uiState.highlightOnHover = state;
    },
    resetCamera(options: Partial<AnimateOptions> = { duration: 1 }) {
      const camera = self.sigma?.getCamera();
      camera?.animatedReset(options).catch(console.error);
    },
    onNodeDeleted(nodeId: string) {
      if (nodeId === self.selectedNode) {
        this.setSelectedNode(null);
      }
      if (nodeId === self.selectedNode) {
        this.setHoveredNode(null);
      }
      self.sigma?.getGraph().dropNode(nodeId);
    },
    deleteEdge(edgeId: string) {
      if (!self.sigma) {
        return;
      }

      const graph = self.sigma.getGraph();
      const attributes = graph.getEdgeAttributes(edgeId);
      if (attributes.connectionType === "MentionToEntity") {
        if (self.selectedEdge === edgeId) {
          this.setSelectedEdge(null);
        }
        if (self.hoveredNode === edgeId) {
          this.setHoveredEdge(null);
        }
        const mentionId = graph.source(edgeId);
        const entityId = graph.target(edgeId);
        const mention = self.dataset.mentions.get(mentionId);
        mention?.removeEntityLink(entityId);
      }
    },
  }));

export interface RootInstance extends Instance<typeof RootStore> {}

const savedUiState = loadFromLocalStorage<UiStateSnapShotIn>(
  DEFINES.uiStateStorageKey,
  {},
);
const initialState = RootStore.create({ uiState: savedUiState });
onSnapshot(initialState.uiState, (snapshot) => {
  storeInLocalStorage(DEFINES.uiStateStorageKey, snapshot);
});

export const rootStore = initialState;

const RootStoreContext = createContext<null | RootInstance>(null);

export const RootStoreProvider = RootStoreContext.Provider;
export function useMst() {
  const store = use(RootStoreContext);
  if (store === null) {
    throw new Error("Store cannot be null, please add a context provider");
  }
  return store;
}
