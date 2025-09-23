import { observer } from "mobx-react";
import { ActionIcon, Stack, Tooltip } from "@mantine/core";
import { IconFocusCentered, IconZoomScan } from "@tabler/icons-react";
import sharedClasses from "@/components/RightWidget/shared.module.css";
import type { GraphNodeInstance } from "@/stores/dataset.ts";
import { useMst } from "@/stores/rootStore.ts";
import { zoomInOnNodeNeighbors } from "@/utils/graphHelpers.ts";

const NodeActions = observer(({ node }: { node: GraphNodeInstance }) => {
  const rootStore = useMst();

  function onZoomToNode() {
    if (!rootStore.sigma) return;
    zoomInOnNodeNeighbors(rootStore.sigma, rootStore.uiState, node.id).catch(
      console.error,
    );
  }

  function onFocusNode() {
    if (rootStore.focusedNode === node.id) {
      rootStore.setFocusedNode(null);
      return;
    }
    rootStore.setFocusedNode(node.id);
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
            rootStore.focusedNode !== node.id ? "Focus on Node" : "Unfocus Node"
          }
          position="left"
        >
          <ActionIcon
            variant={rootStore.focusedNode === node.id ? "filled" : "default"}
            onClick={onFocusNode}
          >
            <IconFocusCentered />
          </ActionIcon>
        </Tooltip>
      </Stack>
    </div>
  );
});

export default NodeActions;
