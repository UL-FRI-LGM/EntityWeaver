import { type CSSProperties, useCallback, useEffect, useState } from "react";
import Graph from "graphology";
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  useLoadGraph,
  ZoomControl,
} from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { observer } from "mobx-react";
import {
  type DatasetInstance,
  type DocumentInstance,
  type EntityGroupInstance,
  useMst,
} from "./stores/rootStore.ts";
import { autorun } from "mobx";
import { useWorkerLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import Sigma from "sigma";
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
    colorAttribute: "pictoColor",
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

// Component that load the graph
export const LoadGraph = observer(() => {
  const loadGraph = useLoadGraph();
  const rootStore = useMst();

  const reloadGraph = useCallback(
    (dataset: DatasetInstance) => {
      const rng = seedrandom("hello.");
      const graph = new Graph();
      const documentIdToDocument = new Map<string, DocumentInstance>();
      const entityGroupIdToDocument = new Map<string, EntityGroupInstance>();

      for (const document of dataset.documents) {
        documentIdToDocument.set(document.id, document);
        graph.addNode(document.globalId, {
          ...getRandomPosition(rng),
          size: DEFINES.document.size,
          label: document.title,
          color: DEFINES.document.color,
          image: "/document.svg",
          pictoColor: DEFINES.document.iconColor,
          type: "pictogram",
        });
      }
      for (const group of dataset.entityGroups) {
        entityGroupIdToDocument.set(group.id, group);
        const entityImage = getImageFromType(group.type);
        graph.addNode(group.globalId, {
          ...getRandomPosition(rng),
          size: 15,
          label: group.name,
          color: DEFINES.entityGroup.color,
          image: entityImage,
          pictoColor: DEFINES.entityGroup.iconColor,
          type: "pictogram",
        });
      }
      for (const entity of dataset.entities) {
        const entityImage = getImageFromType(entity.type);
        graph.addNode(entity.globalId, {
          ...getRandomPosition(rng),
          size: DEFINES.entity.size,
          label: entity.name,
          color: DEFINES.entity.color,
          image: entityImage,
          pictoColor: DEFINES.entity.iconColor,
          type: "pictogram",
        });

        const document = documentIdToDocument.get(entity.document_id);
        if (document) {
          graph.addEdge(entity.globalId, document.globalId, {
            size: DEFINES.documentToEntityEdge.width,
            color: DEFINES.documentToEntityEdge.color,
          });
        }

        const group = entity.group_id
          ? entityGroupIdToDocument.get(entity.group_id)
          : undefined;
        if (group) {
          graph.addEdge(entity.globalId, group.globalId, {
            size: DEFINES.groupToEntityEdge.width,
            color: DEFINES.groupToEntityEdge.color,
          });
        }
      }
      // for (const document of dataset.documents) {
      //   const nodeSize = getNodeSize(graph.edges(document.globalId).length);
      //   graph.updateNodeAttribute(document.globalId, "size", () => nodeSize);
      // }
      for (const group of dataset.entityGroups) {
        const nodeSize = getNodeSize(graph.edges(group.globalId).length);
        graph.updateNodeAttribute(group.globalId, "size", () => nodeSize);
      }
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
  }, [rootStore, reloadGraph]);

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
      kill();
    };
  }, [start, kill, stop, onFinishRenderingLayout]);

  useEffect(() => {
    rootStore.setIsForceAtlasRunning(isRunning);
  }, [isRunning, rootStore]);

  return null;
});

// Component that display the graph
const EntityGraph = observer(() => {
  const rootStore = useMst();
  const [sigma, setSigma] = useState<Sigma | null>(null);

  useEffect(() => {
    if (sigma !== null) {
      rootStore.setSigma(sigma);
    }
  }, [rootStore, sigma]);

  return (
    <SigmaContainer settings={sigmaSettings} ref={setSigma} style={sigmaStyle}>
      <LoadGraph />
      <Fa2 />
      <ControlsContainer position={"bottom-right"}>
        <ZoomControl />
        <FullScreenControl />
      </ControlsContainer>
    </SigmaContainer>
  );
});

// @ts-ignore
export default EntityGraph;
