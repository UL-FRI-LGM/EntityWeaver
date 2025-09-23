import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { isLeftClick } from "@/utils/helpers.ts";
import { LoadingOverlay } from "@mantine/core";
import { DEFINES } from "@/defines.ts";
import { GraphSearch, type GraphSearchOption } from "@react-sigma/graph-search";
import "./EntityGraph.css";
import {
  isEdgeHidden,
  isNodeHidden,
  nodeAdjacentToHighlighted,
} from "@/utils/graphHelpers.ts";
import type { ForceAtlas2LayoutParameters } from "graphology-layout-forceatlas2";
import { MiniMap } from "@react-sigma/minimap";

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
  // defaultDrawNodeHover: () => {
  //   return;
  // },
};

export const GraphEffects = observer(() => {
  const rootStore = useMst();
  const sigma = useSigma<NodeType, EdgeType>();

  const setSettings = useSetSettings<NodeType, EdgeType>();
  const registerEvents = useRegisterEvents<NodeType, EdgeType>();

  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    registerEvents({
      enterNode: (event) => {
        if (!draggedNode) rootStore.setHoveredNode(event.node);
      },
      leaveNode: () => {
        rootStore.setHoveredNode(null);
      },
      // clickNode: (event) => {
      //   if (!dragging.current) rootStore.setSelectedNode(event.node);
      // },
      // TODO figure out why zoom sometimes throws you far off
      // doubleClickNode: (event) => {
      //   if (dragging.current) return;
      //   rootStore.setSelectedNode(event.node);
      //   event.preventSigmaDefault();
      //   zoomInOnNodeNeighbors(sigma, rootStore.uiState, event.node)
      //     .then(() => console.log(rootStore.sigma?.getCamera()))
      //     .catch(console.error);
      // },
      downNode: (event) => {
        if (!isLeftClick(event.event.original) || rootStore.layoutInProgress)
          return;
        setDraggedNode(event.node);
      },
      mousemovebody: (event) => {
        if (!draggedNode) return;
        dragging.current = true;
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
          dragging.current = false;
          sigma.getGraph().removeNodeAttribute(draggedNode, "highlighted");
        }

        /*
          Moved here from clickNode since this triggers first,
          and we want to ensure dragged node is selected after drag ends on another node
        */
        if (draggedNode || rootStore.hoveredNode) {
          rootStore.setSelectedNode(draggedNode ?? rootStore.hoveredNode);
        }
      },
    });
  }, [draggedNode, registerEvents, rootStore, rootStore.dataset, sigma]);

  useEffect(() => {
    if (sigma !== null) {
      rootStore.setSigma(sigma);
    }
  }, [rootStore, sigma]);

  // TODO Replace node and edge reducers if focused node for performance
  useEffect(() => {
    if (!sigma) return;
    const highlightedNodes = new Set<string>();

    if (rootStore.focusedNode !== null) {
      highlightedNodes.add(rootStore.focusedNode);
    } else {
      if (rootStore.uiState.highlightOnHover && rootStore.hoveredNode)
        highlightedNodes.add(rootStore.hoveredNode);
      if (rootStore.uiState.highlightOnSelect && rootStore.selectedNode)
        highlightedNodes.add(rootStore.selectedNode);
      if (rootStore.uiHoveredNode) {
        highlightedNodes.add(rootStore.uiHoveredNode);
      }
    }

    const allHighLightedNodes = new Set<string>();
    setSettings({
      nodeReducer: (node, data) => {
        const graph = sigma.getGraph();
        const newData = {
          ...data,
          highlighted: data.highlighted ?? false,
        };

        if (isNodeHidden(rootStore, node, data)) {
          newData.hidden = true;
        } else if (highlightedNodes.size > 0) {
          if (
            highlightedNodes.has(node) ||
            nodeAdjacentToHighlighted(
              graph,
              rootStore.uiState,
              node,
              highlightedNodes,
            )
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

        if (isEdgeHidden(rootStore.uiState, newData)) {
          newData.hidden = true;
        } else if (allHighLightedNodes.size > 0) {
          let foundOriginalNode = false;
          for (const nodeId of graph.extremities(edge)) {
            if (!allHighLightedNodes.has(nodeId)) {
              newData.hidden = true;
              break;
            }
            if (highlightedNodes.has(nodeId)) {
              foundOriginalNode = true;
            }
          }
          if (!foundOriginalNode) {
            newData.hidden = true;
          }
        }

        return newData;
      },
    });
  }, [
    rootStore,
    rootStore.hoveredNode,
    rootStore.uiState.highlightOnHover,
    rootStore.selectedNode,
    rootStore.uiState.highlightOnSelect,
    rootStore.uiHoveredNode,
    rootStore.focusedNode,
    rootStore.uiState.entityView,
    rootStore.uiState.filters.mentions,
    rootStore.uiState.filters.entities,
    rootStore.uiState.filters.documents,
    rootStore.uiState.filters.people,
    rootStore.uiState.filters.locations,
    rootStore.uiState.filters.organizations,
    rootStore.uiState.filters.miscellaneous,
    rootStore.uiState.filters.collocations,
    setSettings,
    sigma,
    rootStore.uiState,
  ]);

  return null;
});

const forceAtlasOptions: ForceAtlas2LayoutParameters<NodeType, EdgeType> = {
  settings: { slowDown: 10 },
  getEdgeWeight: (_edge, attributes) =>
    DEFINES.layout.edgeWeights[attributes.connectionType],
};

const Fa2 = observer(() => {
  const rootStore = useMst();

  const { start, stop, kill, isRunning } = useWorkerLayoutForceAtlas2(
    forceAtlasOptions as ForceAtlas2LayoutParameters,
  );

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

  const onFocus = useCallback(
    (value: GraphSearchOption | null) => {
      if (value === null) rootStore.setUiHoveredNode(null);
      else if (value.type === "nodes") rootStore.setUiHoveredNode(value.id);
    },
    [rootStore],
  );

  const onChange = useCallback(
    (value: GraphSearchOption | null) => {
      if (value === null) rootStore.setSelectedNode(null);
      else if (value.type === "nodes") rootStore.setSelectedNode(value.id);
    },
    [rootStore],
  );

  const postSearchResult = useCallback(
    (options: GraphSearchOption[]): GraphSearchOption[] => {
      options = options.filter((option) => {
        if (option.type === "message") return true;
        const attributes = sigma?.getGraph().getNodeAttributes(option.id);
        return attributes
          ? !isNodeHidden(rootStore, option.id, attributes)
          : false;
      });
      return options.length <= 10
        ? options
        : [
            ...options.slice(0, 10),
            {
              type: "message",
              message: (
                <span className="text-center text-muted">
                  And {options.length - 10} others
                </span>
              ),
            },
          ];
    },
    [rootStore, sigma],
  );

  return (
    <div className={classes.outerContainer}>
      <div
        className={classes.innerContainer}
        style={{ opacity: rootStore.graphLoading ? 0 : 1 }}
      >
        <SigmaContainer
          ref={(instance) =>
            setSigma(instance as Sigma<NodeType, EdgeType> | null)
          }
          settings={sigmaSettings}
          style={sigmaStyle}
        >
          <GraphEffects />
          <Fa2 />
          <ControlsContainer position={"bottom-right"}>
            <ZoomControl className={classes.controls} />
            <FullScreenControl className={classes.controls} />
          </ControlsContainer>
          <ControlsContainer
            position={"top-right"}
            className={classes.searchContainer}
          >
            {/* In this example we set minisearch options to allow searching on the node's attribute named `tag`.
              Node & edge attributes are indexed with the prefix `prop_` to avoid name collision. */}
            <GraphSearch
              type="nodes"
              className={classes.searchBox}
              value={
                rootStore.selectedNode
                  ? { type: "nodes", id: rootStore.selectedNode }
                  : null
              }
              onFocus={onFocus}
              onChange={onChange}
              postSearchResult={postSearchResult}
              minisearchOptions={{ fields: ["prop_name", "prop_title"] }}
              labels={{
                type_something_to_search: "Start typing to search",
                no_result_found: "No results found",
              }}
            />
          </ControlsContainer>
          {rootStore.dataset.hasData && (
            <ControlsContainer position={"top-left"}>
              <MiniMap width="100px" height="100px" debounceTime={5} />
            </ControlsContainer>
          )}
        </SigmaContainer>
      </div>
      <LoadingOverlay
        visible={rootStore.graphLoading}
        zIndex={1000}
        overlayProps={{
          radius: "sm",
          blur: 2,
          backgroundOpacity: 1,
          color: "#ffffff",
        }}
        transitionProps={{ exitDuration: 1000, enterDelay: 0 }}
      />
    </div>
  );
});

export default EntityGraph;
