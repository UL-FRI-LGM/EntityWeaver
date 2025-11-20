import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
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
import {
  type EdgeType,
  type NodeType,
  useAppState,
} from "@/stores/appState.ts";
import { createNodeImageProgram } from "@sigma/node-image";
import {
  createNodeCompoundProgram,
  type NodeProgramType,
} from "sigma/rendering";
import { createNodeBorderProgram } from "@sigma/node-border";
import classes from "./EntityGraph.module.css";
import type { Settings } from "sigma/settings";
import { isLeftClick } from "@/utils/helpers.ts";
import { Group, LoadingOverlay, Text } from "@mantine/core";
import { DEFINES } from "@/defines.ts";
import { GraphSearch, type GraphSearchOption } from "@react-sigma/graph-search";
import "./EntityGraph.css";
import {
  isEdgeHidden,
  isNodeHidden,
  nodeAdjacentToHighlighted,
} from "@/utils/graphHelpers.ts";
import { MiniMap } from "@react-sigma/minimap";
import DeleteNodeModal from "@/components/DeleteNodeModal/DeleteNodeModal.tsx";
import RightClickIcon from "@/assets/mouse-right-button.svg?react";
import LeftClickIcon from "@/assets/mouse-left-button.svg?react";
import NodeActions from "@/components/EditorWidget/NodeActions.tsx";

const sigmaStyle: CSSProperties = {
  display: "flex",
  overflow: "hidden",
  backgroundColor: DEFINES.backgroundColor,
};

const nodeBorderProgram = createNodeBorderProgram({
  borders: [
    {
      size: { attribute: "borderSize", defaultValue: 0 },
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
  enableEdgeEvents: true,
  allowInvalidContainer: true,
  // defaultDrawNodeHover: () => {
  //   return;
  // },
};

export const GraphEffects = observer(() => {
  const appState = useAppState();
  const sigma = useSigma<NodeType, EdgeType>();

  const setSettings = useSetSettings<NodeType, EdgeType>();
  const registerEvents = useRegisterEvents<NodeType, EdgeType>();

  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    registerEvents({
      enterNode: (event) => {
        if (!draggedNode) appState.setHoveredNode(event.node);
      },
      leaveNode: () => {
        appState.setHoveredNode(null);
      },
      // clickNode: (event) => {
      //   if (!dragging.current) appState.setSelectedNode(event.node);
      // },
      // TODO figure out why zoom sometimes throws you far off
      // doubleClickNode: (event) => {
      //   if (dragging.current) return;
      //   appState.setSelectedNode(event.node);
      //   event.preventSigmaDefault();
      //   zoomInOnNodeNeighbors(sigma, appState.uiState, event.node)
      //     .then(() => console.log(appState.sigma?.getCamera()))
      //     .catch(console.error);
      // },
      downNode: (event) => {
        if (!isLeftClick(event.event.original) || appState.isLayoutInProgress)
          return;
        setDraggedNode(event.node);
      },
      mousemovebody: (event) => {
        if (!draggedNode) return;
        dragging.current = true;
        const pos = sigma.viewportToGraph(event);
        const attributes = sigma.getGraph().getNodeAttributes(draggedNode);
        attributes.source.setPosition(pos);

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
        if (draggedNode || appState.hoveredNode) {
          appState.setSelectedNode(draggedNode ?? appState.hoveredNode);
        }
      },
      // Disable autoscale at the first down interaction, otherwise dragging node out of bounds will rescale the graph
      mousedown: () => {
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
      },
      clickEdge: (event) => {
        if (draggedNode) return;
        appState.setSelectedEdge(event.edge);
      },
      enterEdge(event) {
        if (draggedNode) return;
        appState.setHoveredEdge(event.edge);
      },
      leaveEdge(event) {
        if (appState.hoveredEdge === event.edge) {
          appState.setHoveredEdge(null);
        }
      },
    });
  }, [draggedNode, registerEvents, appState, appState.dataset, sigma]);

  useEffect(() => {
    appState.setSigma(sigma);
  }, [appState, sigma]);

  // TODO Replace node and edge reducers if focused node for performance
  useEffect(() => {
    const highlightedNodes = new Set<string>();
    const highlightedEdges = new Set<string>();

    if (appState.focusedNode !== null) {
      highlightedNodes.add(appState.focusedNode);
    } else {
      if (appState.uiState.highlightOnHover && appState.hoveredNode) {
        highlightedNodes.add(appState.hoveredNode);
      }
      if (appState.uiState.highlightOnSelect && appState.selectedNode) {
        highlightedNodes.add(appState.selectedNode);
      }
      if (appState.uiHoveredNode) {
        highlightedNodes.add(appState.uiHoveredNode);
      }
      if (appState.uiState.highlightOnSelect && appState.selectedEdge) {
        highlightedEdges.add(appState.selectedEdge);
      }
      if (appState.uiState.highlightOnHover && appState.hoveredEdge) {
        highlightedEdges.add(appState.hoveredEdge);
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

        if (appState.selectedNode === node) {
          newData.borderColor = DEFINES.selection.borderColor;
        } else if (appState.uiHoveredNode === node) {
          newData.borderColor = DEFINES.uiHover.borderColor;
        }

        if (isNodeHidden(appState, node, data)) {
          newData.hidden = true;
        } else if (
          highlightedNodes.has(node) ||
          nodeAdjacentToHighlighted(
            graph,
            appState.uiState,
            node,
            highlightedNodes,
            highlightedEdges,
          )
        ) {
          newData.highlighted = true;
          allHighLightedNodes.add(node);
        }

        return newData;
      },
      edgeReducer: (edge, data) => {
        const newData = { ...data, hidden: false };
        const graph = sigma.getGraph();

        if (newData.forceHidden) {
          newData.hidden = true;
          return newData;
        }

        if (!highlightedEdges.has(edge)) {
          if (isEdgeHidden(appState.uiState, newData)) {
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
        }

        return newData;
      },
    });
  }, [
    appState,
    appState.hoveredNode,
    appState.hoveredEdge,
    appState.uiState.highlightOnHover,
    appState.selectedNode,
    appState.uiState.highlightOnSelect,
    appState.uiHoveredNode,
    appState.focusedNode,
    appState.selectedEdge,
    appState.uiState.entityView,
    appState.uiState.filters.mentions,
    appState.uiState.filters.entities,
    appState.uiState.filters.documents,
    appState.uiState.filters.people,
    appState.uiState.filters.locations,
    appState.uiState.filters.organizations,
    appState.uiState.filters.miscellaneous,
    appState.uiState.filters.collocations,
    setSettings,
    sigma,
    appState.uiState,
  ]);

  return null;
});

const EntityGraph = observer(() => {
  const appState = useAppState();

  const onFocus = useCallback(
    (value: GraphSearchOption | null) => {
      if (value === null) appState.setUiHoveredNode(null);
      else if (value.type === "nodes") appState.setUiHoveredNode(value.id);
    },
    [appState],
  );

  const onChange = useCallback(
    (value: GraphSearchOption | null) => {
      if (value === null) appState.setSelectedNode(null);
      else if (value.type === "nodes") appState.setSelectedNode(value.id);
    },
    [appState],
  );

  const postSearchResult = useCallback(
    (options: GraphSearchOption[]): GraphSearchOption[] => {
      options = options.filter((option) => {
        if (option.type === "message") return true;
        const attributes = appState.sigma
          ?.getGraph()
          .getNodeAttributes(option.id);
        return attributes
          ? !isNodeHidden(appState, option.id, attributes)
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
    [appState],
  );

  function onEscapeClick() {
    if (appState.focusedNode) {
      appState.setFocusedNode(null);
    } else {
      appState.setSelectedNode(null);
    }
  }

  function onDeleteClick() {
    appState.setDeleteNodeModalOpen(true);
    if (appState.selectedEdge) {
      appState.deleteEdge(appState.selectedEdge);
    }
  }

  function canvasOnKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "Escape":
        onEscapeClick();
        break;
      case "Delete":
        onDeleteClick();
        break;
    }
  }

  return (
    <div
      className={classes.outerContainer}
      tabIndex={0}
      onKeyDown={canvasOnKeyDown}
      style={{ backgroundColor: DEFINES.backgroundColor }}
    >
      {appState.selectedNodeInstance && (
        <NodeActions node={appState.selectedNodeInstance} />
      )}

      <div
        className={classes.innerContainer}
        style={{ opacity: appState.graphLoading ? 0 : 1 }}
      >
        <SigmaContainer
          ref={(instance) => {
            if (instance === null) return;
            appState.setSigma(instance);
          }}
          settings={sigmaSettings}
          style={sigmaStyle}
        >
          <GraphEffects />
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
                appState.selectedNode
                  ? { type: "nodes", id: appState.selectedNode }
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
          {appState.dataset.hasData && (
            <ControlsContainer position={"top-left"}>
              <MiniMap width="200px" height="200px" debounceTime={5} />
            </ControlsContainer>
          )}
        </SigmaContainer>
      </div>
      <LoadingOverlay
        visible={appState.graphLoading}
        zIndex={100}
        overlayProps={{
          radius: "sm",
          blur: 2,
          backgroundOpacity: 1,
          color: DEFINES.backgroundColor,
        }}
        transitionProps={{ exitDuration: 1000, enterDelay: 0 }}
      />
      <DeleteNodeModal />
    </div>
  );
});

const EntityGraphWidget = observer(() => {
  const appState = useAppState();

  function onContextMenu(event: MouseEvent) {
    event.preventDefault();
    appState.setSelectedNode(null);
    appState.setSelectedEdge(null);
  }

  return (
    <div onContextMenu={onContextMenu} className={classes.graphContainer}>
      <EntityGraph />
      <Group className={classes.graphTooltipContainer}>
        <Group className={classes.mouseClickTooltip}>
          <LeftClickIcon fill="white" width={25} height={25} />
          <Text>Select Node</Text>
        </Group>
        {/*<Group className={classes.mouseClickTooltip}>*/}
        {/*  <LeftClickIcon fill="white" width={25} height={25} />*/}
        {/*  <Text>Zoom to Node</Text>*/}
        {/*  <Text className={classes.doubleClockTooltip}>2x</Text>*/}
        {/*</Group>*/}
        <Group className={classes.mouseClickTooltip}>
          <RightClickIcon fill="white" width={25} height={25} />
          <Text>Reset Selection</Text>
        </Group>
      </Group>
    </div>
  );
});

export default EntityGraphWidget;
