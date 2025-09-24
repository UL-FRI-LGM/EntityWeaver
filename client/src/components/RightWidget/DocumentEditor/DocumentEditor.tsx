import { observer } from "mobx-react";
import classes from "./DocumentEditor.module.css";
import { Button, Fieldset, TextInput, Divider, Stack } from "@mantine/core";
import { useState } from "react";
import { IconEdit } from "@tabler/icons-react";
import { DEFINES } from "@/defines.ts";
import sharedClasses from "../shared.module.css";
import MentionLinkEditor from "@/components/RightWidget/MentionLinkEditor.tsx";
import type { DocumentInstance } from "@/stores/document.ts";
import NodeActions from "@/components/RightWidget/NodeActions.tsx";
import type { MentionInstance } from "@/stores/mention.ts";

const MentionList = observer(
  ({ mentions }: { mentions: MentionInstance[] }) => {
    return (
      <Stack className={classes.linkList}>
        {mentions.map((mention) => (
          <MentionLinkEditor key={mention.id} mention={mention} />
        ))}
      </Stack>
    );
  },
);

const DocumentEditor = observer(
  ({ document }: { document: DocumentInstance }) => {
    const [title, setTitle] = useState(document.title);

    function applyChanges() {
      document.setTitle(title);
    }

    const canApplyChanges = document.title !== title;

    return (
      <Fieldset
        className={sharedClasses.editorFieldset}
        legend={"Document"}
        styles={{
          root: {
            borderColor: DEFINES.document.color,
          },
          legend: {
            color: DEFINES.document.color,
          },
        }}
      >
        <NodeActions node={document} />

        <TextInput
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
        <Button
          disabled={!canApplyChanges}
          variant="filled"
          leftSection={<IconEdit size={14} />}
          onClick={applyChanges}
          className={sharedClasses.applyChangesButton}
        >
          Apply Changes
        </Button>
        <Stack className={classes.mentionsContainer} gap={6}>
          <Divider label="Mentions" labelPosition={"center"} />
          <MentionList mentions={document.mentionList} />
        </Stack>
        {/*<Fieldset legend="Mentions" className={classes.mentionsContainer}>*/}
        {/*  <MentionList documentId={document.id} />*/}
        {/*</Fieldset>*/}
      </Fieldset>
    );
  },
);

export default DocumentEditor;
