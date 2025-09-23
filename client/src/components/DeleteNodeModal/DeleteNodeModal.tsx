import { observer } from "mobx-react";
import { Button, Group, Modal, Text } from "@mantine/core";
import { useMst } from "@/stores/rootStore.ts";

const DeleteNodeModal = observer(() => {
  const rootStore = useMst();

  const nodeAttributes = rootStore.selectedNode
    ? rootStore.sigma?.getGraph().getNodeAttributes(rootStore.selectedNode)
    : null;

  function onDeleteNode() {
    if (rootStore.selectedNodeInstance) {
      rootStore.deleteNode(rootStore.selectedNodeInstance);
      rootStore.setDeleteNodeModalOpen(false);
    }
  }

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
        <Button
          color={"var(--mantine-color-red-9)"}
          data-autofocus
          onClick={onDeleteNode}
        >
          Delete {nodeAttributes?.nodeType}
        </Button>
      </Group>
    </Modal>
  );
});

export default DeleteNodeModal;
