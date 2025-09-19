import { type CSSProperties, useCallback, useEffect, useState } from "react";
import Graph from "graphology";
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  useSetSettings,
  useSigma,
  ZoomControl,
} from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { observer } from "mobx-react";
import {
  type DatasetInstance,
  type EdgeType,
  type NodeType,
  useMst,
} from "./stores/rootStore.ts";
import { autorun } from "mobx";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import seedrandom, { type PRNG } from "seedrandom";
import { createNodeImageProgram } from "@sigma/node-image";
import { createNodeCompoundProgram } from "sigma/rendering";
import { DEFINES } from "./defines.ts";
import { NodeBorderProgram } from "@sigma/node-border";

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

function getRandomPosition(generator?: PRNG) {
  return {
    x: generator ? generator() : Math.random(),
    y: generator ? generator() : Math.random(),
  };
}

function getNodeSize(edges: number) {
  const size = edges * DEFINES.sizePerEdge;
  if (size < DEFINES.minNodeSize) return DEFINES.minNodeSize;
  if (size > DEFINES.maxNodeSize) return DEFINES.maxNodeSize;
  return size;
}

function getImageFromType(type: string) {
  switch (type) {
    case "ORG":
      return "/organization.svg";
    case "LOC":
      return "/location.svg";
    case "PER":
      return "/person.svg";
    case "MISC":
      return "/concept.svg";
    default:
      return "/concept.svg";
  }
}

export const LoadGraph = observer(() => {
  const loadGraph = useLoadGraph();
  const rootStore = useMst();
  const sigma = useSigma<NodeType, EdgeType>();

  const setSettings = useSetSettings<NodeType, EdgeType>();
  const registerEvents = useRegisterEvents<NodeType, EdgeType>();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const reloadGraph = useCallback(
    (dataset: DatasetInstance) => {
      const rng = seedrandom("hello.");
      const graph = new Graph<NodeType, EdgeType>();

      dataset.documents.forEach((document) => {
        graph.addNode(document.id, {
          ...getRandomPosition(rng),
          size: DEFINES.document.size,
          label: document.title,
          color: DEFINES.document.color,
          image: "/document.svg",
          pictogramColor: DEFINES.document.iconColor,
          type: "pictogram",
        });
      });
      dataset.entityGroups.forEach((group) => {
        const entityImage = getImageFromType(group.type);
        graph.addNode(group.id, {
          ...getRandomPosition(rng),
          size: 15,
          label: group.name,
          color: DEFINES.entityGroup.color,
          image: entityImage,
          pictogramColor: DEFINES.entityGroup.iconColor,
          type: "pictogram",
        });
      });
      dataset.entities.forEach((entity) => {
        const entityImage = getImageFromType(entity.type);
        graph.addNode(entity.id, {
          ...getRandomPosition(rng),
          size: DEFINES.entity.size,
          label: entity.name,
          color: DEFINES.entity.color,
          image: entityImage,
          pictogramColor: DEFINES.entity.iconColor,
          type: "pictogram",
        });

        const document = dataset.documents.get(entity.document_id);
        if (document) {
          graph.addEdge(entity.id, document.id, {
            size: DEFINES.documentToEntityEdge.width,
            color: DEFINES.documentToEntityEdge.color,
          });
        }

        const group = entity.group_id
          ? dataset.entityGroups.get(entity.group_id)
          : undefined;
        if (group) {
          graph.addEdge(entity.id, group.id, {
            size: DEFINES.groupToEntityEdge.width,
            color: DEFINES.groupToEntityEdge.color,
          });
        }
      });
      // for (const document of dataset.documents) {
      //   const nodeSize = getNodeSize(graph.edges(document.globalId).length);
      //   graph.updateNodeAttribute(document.globalId, "size", () => nodeSize);
      // }
      dataset.entityGroups.forEach((group) => {
        const nodeSize = getNodeSize(graph.edges(group.id).length);
        graph.updateNodeAttribute(group.id, "size", () => nodeSize);
      });
      loadGraph(graph);
    },
    [loadGraph],
  );

  useEffect(() => {
    const disposer = autorun(() => {
      if (rootStore.dataset) {
        reloadGraph(rootStore.dataset);
      }
    });

    return () => disposer();
  }, [rootStore, reloadGraph, registerEvents]);

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
    start();

    setTimeout(() => {
      stop();
      onFinishRenderingLayout();
    }, 2000);

    return () => {
      // This prevents hot reload from working properly
      // kill();
    };
  }, [start, kill, stop, onFinishRenderingLayout]);

  useEffect(() => {
    rootStore.setIsForceAtlasRunning(isRunning);
  }, [isRunning, rootStore]);

  return null;
});

const EntityGraph = observer(() => {
  return (
    <SigmaContainer settings={sigmaSettings} style={sigmaStyle}>
      <LoadGraph />
      <Fa2 />
      <ControlsContainer position={"bottom-right"}>
        <ZoomControl />
        <FullScreenControl />
      </ControlsContainer>
    </SigmaContainer>
  );
});

export default EntityGraph;
