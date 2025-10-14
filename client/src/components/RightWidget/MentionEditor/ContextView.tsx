import { observer } from "mobx-react";
import { Accordion, Mark, Text } from "@mantine/core";
import type { Mention } from "@/stores/mention.ts";
import classes from "./ContextView.module.css";
import { typeToColor } from "@/utils/helpers.ts";
import { IconFileBroken } from "@tabler/icons-react";
import { useAppState } from "@/stores/appState.ts";
import globalClasses from "@/styles/global.module.css";

const ContextView = observer(({ mention }: { mention: Mention }) => {
  const appState = useAppState();

  const contextSnippet = mention.contextSnippet;
  const color =
    typeToColor(mention.type) ?? "var(--mantine-primary-color-filled)";

  return (
    <Accordion
      variant="contained"
      classNames={{ label: classes.label }}
      value={appState.uiState.mentionContextOpen ? "open" : "closed"}
      onChange={(value) => appState.uiState.setMentionContextOpen(!!value)}
    >
      <Accordion.Item key={mention.id} value={"open"}>
        <Accordion.Control icon={<IconFileBroken />}>
          Mention Context
        </Accordion.Control>
        <Accordion.Panel>
          <Text>
            {contextSnippet.before}
            <Mark className={globalClasses.mark} color={color}>
              {contextSnippet.mention}
            </Mark>
            {contextSnippet.after}
          </Text>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
});

export default ContextView;
