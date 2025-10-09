import { observer } from "mobx-react";
import { useAppState } from "@/stores/appState.ts";
import { ActionIcon, Group, Paper, Text, Tooltip } from "@mantine/core";
import classes from "./shared.module.css";
import { IconEdit } from "@tabler/icons-react";
import type { Mention } from "@/stores/mention.ts";

const MentionLinkEditor = observer(({ mention }: { mention: Mention }) => {
  const appState = useAppState();
  return (
    <Paper
      className={classes.mentionLinkEntry}
      shadow="xl"
      withBorder
      onMouseEnter={() => appState.setUiHoveredNode(mention.id)}
      onMouseLeave={() => appState.setUiHoveredNode(null)}
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
            onClick={() => appState.setSelectedNode(mention.id)}
          >
            <IconEdit />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
});

export default MentionLinkEditor;
