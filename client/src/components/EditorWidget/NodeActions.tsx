import { observer } from "mobx-react";
import { ActionIcon, Stack, Tooltip } from "@mantine/core";
import {
  IconFocusCentered,
  IconTrash,
  IconZoomScan,
} from "@tabler/icons-react";
import sharedClasses from "@/components/EditorWidget/shared.module.css";
import { useAppState } from "@/stores/appState.ts";
import { zoomInOnNodeNeighbors } from "@/utils/graphHelpers.ts";
import type { GraphEntity } from "@/stores/graphEntity.ts";

const NodeActions = observer(({ node }: { node: GraphEntity }) => {
  const appState = useAppState();

  function onZoomToNode() {
    if (!appState.sigma) return;
    zoomInOnNodeNeighbors(appState.sigma, appState, node.id).catch(
      console.error,
    );
  }

  function onFocusNode() {
    if (appState.focusedNode === node.id) {
      appState.setFocusedNode(null);
      return;
    }
    appState.setFocusedNode(node.id);
  }

  return (
    <div className={sharedClasses.actionsContainer}>
      <Stack gap={5}>
        <Tooltip label={"Zoom to Node"} position="left">
          <ActionIcon variant={"default"} onClick={onZoomToNode}>
            <IconZoomScan />
          </ActionIcon>
        </Tooltip>
        <Tooltip
          label={
            appState.focusedNode !== node.id ? "Focus on Node" : "Unfocus Node"
          }
          position="left"
        >
          <ActionIcon
            variant={appState.focusedNode === node.id ? "filled" : "default"}
            onClick={onFocusNode}
          >
            <IconFocusCentered />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={"Delete Node"} position="left">
          <ActionIcon
            variant={"filled"}
            color={"var(--mantine-color-red-9)"}
            onClick={() => {
              appState.setDeleteNodeModalOpen(true);
            }}
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Tooltip>
      </Stack>
    </div>
  );
});

export default NodeActions;
