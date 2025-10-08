import { observer } from "mobx-react";
import { useAppState } from "@/stores/rootStore.ts";
import { ActionIcon, Group, Paper, Text, Tooltip } from "@mantine/core";
import classes from "./shared.module.css";
import { IconEdit } from "@tabler/icons-react";
import type { Mention } from "@/stores/mention.ts";

const MentionLinkEditor = observer(({ mention }: { mention: Mention }) => {
  const rootStore = useAppState();
  return (
    <Paper
      className={classes.mentionLinkEntry}
      shadow="xl"
      withBorder
      onMouseEnter={() => rootStore.setUiHoveredNode(mention.id)}
      onMouseLeave={() => rootStore.setUiHoveredNode(null)}
    >
      <Group wrap={"nowrap"} justify="space-between" gap={0}>
        <Text
          truncate="end"
          component="span"
          className={classes.mentionLinkText}
        >
          {mention.name}
        </Text>
        <Tooltip label={"Open Mention Editor"}>
          <ActionIcon
            variant="default"
            onClick={() => rootStore.setSelectedNode(mention.id)}
          >
            <IconEdit />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
});

export default MentionLinkEditor;
