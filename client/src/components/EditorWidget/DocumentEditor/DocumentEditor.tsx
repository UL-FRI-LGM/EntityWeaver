import { observer } from "mobx-react";
import classes from "./DocumentEditor.module.css";
import { Button, Fieldset, TextInput, Divider, Stack } from "@mantine/core";
import { useState } from "react";
import { IconEdit } from "@tabler/icons-react";
import { DEFINES } from "@/defines.ts";
import sharedClasses from "../shared.module.css";
import MentionLinkEditor from "@/components/EditorWidget/MentionLinkEditor.tsx";
import type { Mention } from "@/stores/mention.ts";
import { Document } from "@/stores/document.ts";
import AttributeSelectors from "@/components/AttributeSelectors/AttributeSelectors.tsx";
import type { NodeAttributes } from "@/utils/schemas.ts";
import { hasDifferenceOrAddition } from "@/utils/helpers.ts";
import { redrawNode } from "@/utils/graphHelpers.ts";
import { useAppState } from "@/stores/appState.ts";

const MentionList = observer(({ mentions }: { mentions: Mention[] }) => {
  return (
    <Stack className={classes.linkList}>
      {mentions.map((mention) => (
        <MentionLinkEditor key={mention.id} mention={mention} />
      ))}
    </Stack>
  );
});

const DocumentEditor = observer(({ document }: { document: Document }) => {
  const appState = useAppState();
  const [title, setTitle] = useState(document.title);
  const [changes, setChanges] = useState<NodeAttributes>(document.attributes);

  function applyChanges() {
    document.setTitle(title);
    for (const [attributeName, value] of Object.entries(changes)) {
      document.setAttributeValue(attributeName, value);
    }
    redrawNode(appState.sigma, document);
  }

  const canApplyChanges =
    document.title !== title ||
    hasDifferenceOrAddition(changes, document.attributes);

  return (
    <Fieldset
      className={sharedClasses.editorFieldset}
      legend={"Document"}
      styles={{
        root: {
          borderColor: DEFINES.nodes.Document.color,
        },
        legend: {
          color: DEFINES.nodes.Document.color,
        },
      }}
    >
      {/*<NodeActions node={document} />*/}
      <Stack gap={10}>
        <TextInput
          label="Title"
          value={title}
          onChange={(event) => {
            setTitle(event.currentTarget.value);
          }}
        />

        <AttributeSelectors
          // nodeSource={entity}
          values={changes}
          attributes={
            document.dataset.attributeManager.documentProperties
              .nonReservedAttributes
          }
          onSetAttribute={(attribute, value) => {
            setChanges((prevChanges) => ({
              ...prevChanges,
              [attribute.name]: value,
            }));
          }}
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
      </Stack>
      <Stack className={classes.mentionsContainer} gap={6}>
        <Divider label="Mentions" labelPosition={"center"} />
        <MentionList mentions={document.mentionList} />
      </Stack>
    </Fieldset>
  );
});

export default DocumentEditor;
