import { type CSSProperties, useEffect } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";

const sigmaStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
};

// Component that load the graph
export const LoadGraph = () => {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    const graph = new Graph();
    graph.addNode("first", {
      x: 0,
      y: 0,
      size: 15,
      label: "My first node",
      color: "#FA4F40",
    });
    loadGraph(graph);
  }, [loadGraph]);

  return null;
};

// Component that display the graph
const EntityGraph = () => {
  return (
    <SigmaContainer style={sigmaStyle}>
      <LoadGraph />
    </SigmaContainer>
  );
};

export default EntityGraph;
