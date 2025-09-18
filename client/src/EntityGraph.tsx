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

const sigmaStyle: CSSProperties = {
  display: "flex",
};

function getRandomPosition() {
  return {
    x: Math.random(),
    y: Math.random(),
  };
}

// Component that load the graph
export const LoadGraph = observer(() => {
  const loadGraph = useLoadGraph();
  const rootStore = useMst();

  const reloadGraph = useCallback(
    (dataset: DatasetInstance) => {
      const graph = new Graph();
      const documentIdToDocument = new Map<string, DocumentInstance>();
      const entityGroupIdToDocument = new Map<string, EntityGroupInstance>();
      for (const document of dataset.documents) {
        documentIdToDocument.set(document.id, document);
        graph.addNode(document.globalId, {
          ...getRandomPosition(),
          size: 15,
          label: document.title,
          color: "#bddb18",
        });
      }
      for (const group of dataset.entityGroups) {
        entityGroupIdToDocument.set(group.id, group);
        graph.addNode(group.globalId, {
          ...getRandomPosition(),
          size: 15,
          label: group.name,
          color: "#0036ff",
        });
      }
      for (const entity of dataset.entities) {
        const group = entityGroupIdToDocument.get(entity.group_id);
        const document = documentIdToDocument.get(entity.document_id);
        graph.addNode(entity.globalId, {
          ...getRandomPosition(),
          size: 15,
          label: entity.name,
          color: "#FA4F40",
        });
        graph.addEdge(entity.globalId, document?.globalId, {
          size: 5,
          color: "#cc07ff",
        });
        graph.addEdge(entity.globalId, group?.globalId, {
          size: 5,
          color: "#2fdffa",
        });
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
    <SigmaContainer ref={setSigma} style={sigmaStyle}>
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
