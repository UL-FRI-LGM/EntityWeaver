import { observer } from "mobx-react";
import { Button, Group, Modal, Text, Tooltip } from "@mantine/core";
import { useAppState } from "@/stores/appState.ts";

const DeleteNodeModal = observer(() => {
  const appState = useAppState();

  const nodeAttributes = appState.selectedNode
    ? appState.sigma?.getGraph().getNodeAttributes(appState.selectedNode)
    : null;

  function onDeleteNode() {
    if (appState.selectedNodeInstance) {
      appState.selectedNodeInstance.dispose();
      appState.setDeleteNodeModalOpen(false);
    }
  }

  const canDeleteNode = !!appState.selectedNodeInstance?.canDelete;

  return (
    <Modal
      size="auto"
      opened={appState.deleteNodeModalOpen}
      onClose={() => {
        appState.setDeleteNodeModalOpen(false);
      }}
      title={
        <>
          <Text>
            Are you sure you want to delete the following{" "}
            {nodeAttributes?.source.nodeType}?
          </Text>
          <Text fs="italic">{nodeAttributes?.label}</Text>
        </>
      }
      centered
      withCloseButton={false}
    >
      <Group justify="end" mt={"10px"}>
        <Button
          variant="default"
          onClick={() => {
            appState.setDeleteNodeModalOpen(false);
          }}
        >
          Cancel
        </Button>
        <Tooltip
          label={"Document can only be deleted if it has no attached mentions."}
          disabled={canDeleteNode}
          position={"bottom"}
        >
          <Button
            color={"var(--mantine-color-red-9)"}
            data-autofocus
            onClick={onDeleteNode}
            disabled={!canDeleteNode}
          >
            Delete {nodeAttributes?.source.nodeType}
          </Button>
        </Tooltip>
      </Group>
    </Modal>
  );
});

export default DeleteNodeModal;
