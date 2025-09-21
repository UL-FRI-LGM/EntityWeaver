import { createContext, use } from "react";
import { types, type Instance } from "mobx-state-tree";
import type Sigma from "sigma";
import { updateGraph, updateNodeProperties } from "@/utils/graphHelpers.ts";
import type { AnimateOptions } from "sigma/utils";
import { Dataset, type NodeTypes } from "@/stores/dataset.ts";
import { mentionPrefix } from "@/stores/mention.ts";
import { documentPrefix } from "@/stores/document.ts";
import { entityPrefix } from "@/stores/entity.ts";
import { DEFINES } from "@/defines.ts";

export interface NodeType {
  x: number;
  y: number;
  label: string;
  size: number;
  color: string;
  highlighted?: boolean;
  borderColor?: string;
  borderSize?: number;
  image: string;
  pictogramColor: string;
  type: string;
  nodeType: NodeTypes;
}
export interface EdgeType {
  size: number;
  color: string;
  connectionType: "Document" | "Entity";
}

const RootStore = types
  .model({
    dataset: types.optional(Dataset, {}),
    isForceAtlasRunning: types.optional(types.boolean, false),
  })
  .volatile(() => ({
    sigma: null as Sigma<NodeType, EdgeType> | null,
    selectedNode: null as string | null,
    hoveredNode: null as string | null,
    uiHoveredNode: null as string | null,
    runLayout: false,
    layoutInProgress: false,
    holdingShift: false,
    highlightOnSelect: true,
    highlightOnHover: true,
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
  }))
  .actions((self) => ({
    setIsForceAtlasRunning(state: boolean) {
      self.isForceAtlasRunning = state;
    },
    setSigma(sigma: Sigma<NodeType, EdgeType>) {
      self.sigma = sigma;
      this.runGraphUpdate();
    },
    setSelectedNode(nodeId: string | null) {
      if (self.selectedNode && nodeId === null) {
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
    onDatasetUpdate() {
      this.runGraphUpdate();
    },
    runGraphUpdate() {
      if (self.sigma && !self.dataset.fetchingData) {
        updateGraph(self.sigma, self.dataset);
        self.runLayout = true;
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
      self.highlightOnSelect = state;
    },
    setHighlightOnHover(state: boolean) {
      self.highlightOnHover = state;
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
      self.layoutInProgress = false;
    },
    resetCamera(options: Partial<AnimateOptions> = { duration: 1 }) {
      const camera = self.sigma?.getCamera();
      camera?.animatedReset(options).catch(console.error);
    },
  }));

export interface RootInstance extends Instance<typeof RootStore> {}

const initialState = RootStore.create({});

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
