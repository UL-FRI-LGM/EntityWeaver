import { type CSSProperties, useEffect, useState } from "react";
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  useRegisterEvents,
  useSetSettings,
  useSigma,
  ZoomControl,
} from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { observer } from "mobx-react";
import { type EdgeType, type NodeType, useMst } from "@/stores/rootStore.ts";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { createNodeImageProgram } from "@sigma/node-image";
import {
  createNodeCompoundProgram,
  type NodeProgramType,
} from "sigma/rendering";
import { NodeBorderProgram } from "@sigma/node-border";
import classes from "./EntityGraph.module.css";
import type Sigma from "sigma";
import type { Settings } from "sigma/settings";
import { getCameraStateToFitViewportToNodes } from "@sigma/utils";

const sigmaStyle: CSSProperties = {
  display: "flex",
  overflow: "hidden",
};

const nodePictogramProgram = createNodeCompoundProgram<NodeType, EdgeType>([
  NodeBorderProgram as NodeProgramType<NodeType, EdgeType>,
  createNodeImageProgram({
    keepWithinCircle: true,
    correctCentering: true,
    drawingMode: "color",
    colorAttribute: "pictogramColor",
    padding: 0.15,
  }),
]);

const sigmaSettings: Partial<Settings<NodeType, EdgeType>> = {
  // allowInvalidContainer: true,
  nodeProgramClasses: {
    pictogram: nodePictogramProgram,
    bordered: NodeBorderProgram,
  },
  defaultNodeType: "bordered",
  // defaultEdgeType: "arrow",
  labelDensity: 0.07,
  labelGridCellSize: 60,
  labelRenderedSizeThreshold: 15,
  // labelFont: "Lato, sans-serif",
  zIndex: true,
  doubleClickZoomingRatio: 1,
};

export const GraphEffects = observer(() => {
  const rootStore = useMst();
  const sigma = useSigma<NodeType, EdgeType>();

  const setSettings = useSetSettings<NodeType, EdgeType>();
  const registerEvents = useRegisterEvents<NodeType, EdgeType>();

  useEffect(() => {
    registerEvents({
      enterNode: (event) => {
        rootStore.setHoveredNode(event.node);
      },
      leaveNode: () => {
        rootStore.setHoveredNode(null);
      },
      clickNode: (event) => rootStore.setSelectedNode(event.node),
      doubleClickNode: (event) => {
        rootStore.setSelectedNode(event.node);
        event.preventSigmaDefault();
        const graph = sigma.getGraph();
        const nodes = sigma
          .getGraph()
          .filterNodes(
            (nodeId) =>
              nodeId === event.node ||
              graph.neighbors(event.node).includes(nodeId),
          );
        const cameraState = getCameraStateToFitViewportToNodes(
          // @ts-ignore: TS2345
          sigma,
          nodes,
        );
        sigma
          .getCamera()
          .animate(cameraState, { duration: 1000 })
          .catch(console.error);
      },
    });
  }, [registerEvents, rootStore, sigma]);

  useEffect(() => {
    if (sigma !== null) {
      rootStore.setSigma(sigma);
    }
  }, [rootStore, sigma]);

  useEffect(() => {
    const highlightedNode =
      rootStore.highlightOnSelect && rootStore.selectedNode
        ? rootStore.selectedNode
        : rootStore.hoveredNode;
    setSettings({
      nodeReducer: (node, data) => {
        const graph = sigma.getGraph();
        const newData = { ...data, highlighted: data.highlighted ?? false };

        if (highlightedNode) {
          newData.highlighted =
            node === highlightedNode ||
            graph.neighbors(highlightedNode).includes(node);
        }
        return newData;
      },
      edgeReducer: (edge, data) => {
        const graph = sigma.getGraph();
        const newData = { ...data, hidden: false };

        if (
          highlightedNode &&
          !graph.extremities(edge).includes(highlightedNode)
        ) {
          newData.hidden = true;
        }
        return newData;
      },
    });
  }, [
    rootStore.hoveredNode,
    rootStore.selectedNode,
    rootStore.highlightOnSelect,
    setSettings,
    sigma,
  ]);

  return null;
  // return <button onClick={() => rootStore.test()}></button>;
});

const Fa2 = observer(() => {
  const rootStore = useMst();

  const { start, stop, kill, isRunning } = useWorkerLayoutForceAtlas2({
    settings: { slowDown: 10 },
  });

  useEffect(() => {
    if (rootStore.runLayout) {
      rootStore.setRunLayout(false);
      start();

      setTimeout(() => {
        stop();
        rootStore.onFinishRenderingLayout();
      }, 2000);
    }

    return () => {
      // This prevents hot reload from working properly
      // kill();
    };
  }, [start, kill, stop, rootStore.runLayout, rootStore]);

  useEffect(() => {
    rootStore.setIsForceAtlasRunning(isRunning);
  }, [isRunning, rootStore]);

  return null;
});

const EntityGraph = observer(() => {
  const rootStore = useMst();
  const [sigma, setSigma] = useState<Sigma<NodeType, EdgeType> | null>(null);

  useEffect(() => {
    if (sigma !== null) {
      rootStore.setSigma(sigma);
    }
  }, [rootStore, sigma]);

  return (
    <SigmaContainer
      ref={(instance) => setSigma(instance as Sigma<NodeType, EdgeType> | null)}
      settings={sigmaSettings}
      style={sigmaStyle}
    >
      <GraphEffects />
      <Fa2 />
      <ControlsContainer position={"bottom-right"}>
        <ZoomControl className={classes.controls} />
        <FullScreenControl className={classes.controls} />
      </ControlsContainer>
    </SigmaContainer>
  );
});

export default EntityGraph;
