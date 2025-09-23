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
  setColorByType,
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
    selectedNode: null as string | null,
    hoveredNode: null as string | null,
    uiHoveredNode: null as string | null,
    runLayout: false,
    layoutInProgress: false,
    isForceAtlasRunning: false,
    holdingShift: false,
    loadingData: false,
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
        self.loadingData || self.dataset.fetchingData || self.layoutInProgress
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
    setIsForceAtlasRunning(state: boolean) {
      self.isForceAtlasRunning = state;
    },
    setSigma(sigma: Sigma<NodeType, EdgeType>) {
      self.sigma = sigma;
    },
    setSelectedNode(nodeId: string | null) {
      if (self.selectedNode) {
        updateNodeProperties(self.sigma, self.selectedNode, {
          borderColor: undefined,
        });
      }
      self.selectedNode = nodeId;
      if (nodeId) {
        updateNodeProperties(self.sigma, nodeId, {
          borderColor: DEFINES.selection.borderColor,
        });
      }
      this.setUiHoveredNode(null);
    },
    setHoveredNode(nodeId: string | null) {
      self.hoveredNode = nodeId;
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
        if (runLayout) self.runLayout = runLayout;
      }
    },
    setRunLayout(state: boolean) {
      self.runLayout = state;
    },
    setLayoutInProgress(state: boolean) {
      self.layoutInProgress = state;
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
    onFinishRenderingLayout() {
      // const cameraState = self.sigma?.getCamera().getState();
      // if (!cameraState) return;
      // if (
      //   cameraState.x === 0.5 &&
      //   cameraState.y === 0.5 &&
      //   cameraState.ratio === 1
      // ) {
      //   this.resetCamera();
      // }
      self.sigma?.getGraph().forEachNode((node, attributes) => {
        self.dataset.setNodePosition(node, attributes.nodeType, attributes);
      });
      this.setLayoutInProgress(false);
    },
    resetCamera(options: Partial<AnimateOptions> = { duration: 1 }) {
      const camera = self.sigma?.getCamera();
      camera?.animatedReset(options).catch(console.error);
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
