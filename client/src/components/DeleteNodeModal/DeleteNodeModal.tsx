import { observer } from "mobx-react";
import { Button, Group, Modal, Text, Tooltip } from "@mantine/core";
import { useAppState } from "@/stores/rootStore.ts";
import { Document } from "@/stores/document.ts";

const DeleteNodeModal = observer(() => {
  const rootStore = useAppState();

  const nodeAttributes = rootStore.selectedNode
    ? rootStore.sigma?.getGraph().getNodeAttributes(rootStore.selectedNode)
    : null;

  function onDeleteNode() {
    if (rootStore.selectedNodeInstance) {
      rootStore.dataset.deleteNode(rootStore.selectedNodeInstance);
      rootStore.setDeleteNodeModalOpen(false);
    }
  }

  const canDeleteNode =
    rootStore.selectedNodeInstance !== null &&
    rootStore.selectedNodeInstance &&
    (!(rootStore.selectedNodeInstance instanceof Document) ||
      (rootStore.selectedNodeInstance as Document).canDelete);

  return (
    <Modal
      size="auto"
      opened={rootStore.deleteNodeModalOpen}
      onClose={() => rootStore.setDeleteNodeModalOpen(false)}
      title={
        <>
          <Text>
            Are you sure you want to delete the following{" "}
            {nodeAttributes?.nodeType}?
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
          onClick={() => rootStore.setDeleteNodeModalOpen(false)}
        >
          Cancel
        </Button>
        <Tooltip
          label={"Document can only be deleted if it has attached mentions"}
          disabled={canDeleteNode}
          position={"bottom"}
        >
          <Button
            color={"var(--mantine-color-red-9)"}
            data-autofocus
            onClick={onDeleteNode}
            disabled={!canDeleteNode}
          >
            Delete {nodeAttributes?.nodeType}
          </Button>
        </Tooltip>
      </Group>
    </Modal>
  );
});

export default DeleteNodeModal;
