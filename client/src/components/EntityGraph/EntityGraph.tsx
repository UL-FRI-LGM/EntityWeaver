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
import { createNodeBorderProgram } from "@sigma/node-border";
import classes from "./EntityGraph.module.css";
import type Sigma from "sigma";
import type { Settings } from "sigma/settings";
import { getCameraStateToFitViewportToNodes } from "@sigma/utils";
import { isLeftClick } from "@/utils/helpers.ts";
import { LoadingOverlay } from "@mantine/core";
import { DEFINES } from "@/defines.ts";

const sigmaStyle: CSSProperties = {
  display: "flex",
  overflow: "hidden",
};

const nodeBorderProgram = createNodeBorderProgram({
  borders: [
    {
      size: { attribute: "borderSize", defaultValue: 0.1 },
      color: { attribute: "borderColor", defaultValue: "black" },
    },
    { size: { fill: true }, color: { attribute: "color" } },
  ],
});

const nodePictogramProgram = createNodeCompoundProgram<NodeType, EdgeType>([
  nodeBorderProgram as NodeProgramType<NodeType, EdgeType>,
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
    bordered: nodeBorderProgram,
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

  const [draggedNode, setDraggedNode] = useState<string | null>(null);

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
      downNode: (event) => {
        if (!isLeftClick(event.event.original) || rootStore.layoutInProgress)
          return;
        setDraggedNode(event.node);
      },
      mousemovebody: (event) => {
        if (!draggedNode) return;
        const pos = sigma.viewportToGraph(event);
        const attributes = sigma.getGraph().getNodeAttributes(draggedNode);
        rootStore.dataset.setNodePosition(
          draggedNode,
          attributes.nodeType,
          pos,
        );

        event.preventSigmaDefault();
        event.original.preventDefault();
        event.original.stopPropagation();
      },
      mouseup: () => {
        if (draggedNode) {
          setDraggedNode(null);
          sigma.getGraph().removeNodeAttribute(draggedNode, "highlighted");
        }
      },
    });
  }, [draggedNode, registerEvents, rootStore, rootStore.dataset, sigma]);

  useEffect(() => {
    if (sigma !== null) {
      rootStore.setSigma(sigma);
    }
  }, [rootStore, sigma]);

  useEffect(() => {
    const highlightedNodes = new Set<string>();
    if (rootStore.highlightOnHover && rootStore.hoveredNode)
      highlightedNodes.add(rootStore.hoveredNode);
    if (rootStore.highlightOnSelect && rootStore.selectedNode)
      highlightedNodes.add(rootStore.selectedNode);
    if (rootStore.uiHoveredNode) {
      highlightedNodes.add(rootStore.uiHoveredNode);
    }

    const allHighLightedNodes = new Set<string>();

    setSettings({
      nodeReducer: (node, data) => {
        const graph = sigma.getGraph();
        const newData = {
          ...data,
          highlighted: data.highlighted ?? false,
        };

        if (rootStore.entityView && data.nodeType === "Mention") {
          newData.hidden = true;
        } else if (highlightedNodes.size > 0) {
          if (
            highlightedNodes.has(node) ||
            graph.neighbors(node).some((nodeId) => highlightedNodes.has(nodeId))
          ) {
            newData.highlighted = true;
            allHighLightedNodes.add(node);
          }
        }
        return newData;
      },
      edgeReducer: (edge, data) => {
        const newData = { ...data, hidden: false };
        const graph = sigma.getGraph();

        if (
          !rootStore.entityView &&
          data.connectionType === "EntityToDocument"
        ) {
          newData.hidden = true;
        } else if (allHighLightedNodes.size > 0) {
          for (const nodeId of graph.extremities(edge)) {
            if (!allHighLightedNodes.has(nodeId)) {
              newData.hidden = true;
              break;
            }
          }
        }

        return newData;
      },
    });
  }, [
    rootStore.hoveredNode,
    rootStore.highlightOnHover,
    rootStore.selectedNode,
    rootStore.highlightOnSelect,
    rootStore.uiHoveredNode,
    rootStore.entityView,
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
      rootStore.setLayoutInProgress(true);
      start();

      setTimeout(() => {
        stop();
        rootStore.onFinishRenderingLayout();
      }, DEFINES.layoutRuntimeInMs);
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
      <LoadingOverlay
        visible={rootStore.graphLoading}
        zIndex={1000}
        overlayProps={{
          radius: "sm",
          blur: 2,
          backgroundOpacity: 1,
          color: "#ffffff",
        }}
        transitionProps={{ exitDuration: 500 }}
      />
    </SigmaContainer>
  );
});

export default EntityGraph;
