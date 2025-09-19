import { type CSSProperties, useCallback, useEffect, useState } from "react";
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
import { type EdgeType, type NodeType, useMst } from "./stores/rootStore.ts";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import { createNodeImageProgram } from "@sigma/node-image";
import { createNodeCompoundProgram } from "sigma/rendering";
import { NodeBorderProgram } from "@sigma/node-border";
import type Sigma from "sigma";

const sigmaStyle: CSSProperties = {
  display: "flex",
  overflow: "hidden",
};

const nodePictogramProgram = createNodeCompoundProgram([
  NodeBorderProgram,
  createNodeImageProgram({
    keepWithinCircle: true,
    correctCentering: true,
    drawingMode: "color",
    colorAttribute: "pictogramColor",
    padding: 0.15,
  }),
]);

const sigmaSettings = {
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
};

export const GraphEffects = observer(() => {
  const rootStore = useMst();
  const sigma = useSigma<NodeType, EdgeType>();

  const setSettings = useSetSettings<NodeType, EdgeType>();
  const registerEvents = useRegisterEvents<NodeType, EdgeType>();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    registerEvents({
      enterNode: (event) => {
        setHoveredNode(event.node);
        rootStore.setHoveredNode(event.node);
      },
      leaveNode: () => {
        setHoveredNode(null);
        rootStore.setHoveredNode(null);
      },
      clickNode: (event) => rootStore.setSelectedNode(event.node),
    });
  }, [registerEvents, rootStore]);

  useEffect(() => {
    if (sigma !== null) {
      rootStore.setSigma(sigma);
    }
  }, [rootStore, sigma]);

  useEffect(() => {
    setSettings({
      nodeReducer: (node, data) => {
        const graph = sigma.getGraph();
        const newData = { ...data, highlighted: data.highlighted ?? false };

        if (hoveredNode) {
          newData.highlighted =
            node === hoveredNode || graph.neighbors(hoveredNode).includes(node);
        }
        return newData;
      },
      edgeReducer: (edge, data) => {
        const graph = sigma.getGraph();
        const newData = { ...data, hidden: false };

        if (hoveredNode && !graph.extremities(edge).includes(hoveredNode)) {
          newData.hidden = true;
        }
        return newData;
      },
    });
  }, [hoveredNode, setSettings, sigma]);

  return null;
});

const Fa2 = observer(() => {
  const rootStore = useMst();

  const { start, stop, kill, isRunning } = useWorkerLayoutForceAtlas2({
    settings: { slowDown: 10 },
  });

  const onFinishRenderingLayout = useCallback(() => {
    const camera = rootStore.sigma?.getCamera();
    camera?.animatedReset();
  }, [rootStore]);

  useEffect(() => {
    if (rootStore.runLayout) {
      rootStore.setRunLayout(false);
      start();

      setTimeout(() => {
        stop();
        onFinishRenderingLayout();
      }, 2000);
    }

    return () => {
      // This prevents hot reload from working properly
      // kill();
    };
  }, [
    start,
    kill,
    stop,
    onFinishRenderingLayout,
    rootStore.runLayout,
    rootStore,
  ]);

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
        <ZoomControl />
        <FullScreenControl />
      </ControlsContainer>
    </SigmaContainer>
  );
});

export default EntityGraph;
