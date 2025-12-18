import { observer } from "mobx-react";
import classes from "./EntityEditor.module.css";
import sharedClasses from "../shared.module.css";
import { Button, Fieldset, Stack, TextInput, Divider } from "@mantine/core";
import { useState } from "react";
import { IconEdit } from "@tabler/icons-react";
import MentionLinkEditor from "@/components/EditorWidget/MentionLinkEditor.tsx";
import type { Entity } from "@/stores/entity.ts";
import AttributeSelectors from "@/components/AttributeSelectors/AttributeSelectors.tsx";
import type { NodeAttributes } from "@/utils/schemas.ts";
import { hasDifferenceOrAddition } from "@/utils/helpers.ts";
import { redrawNode } from "@/utils/graphHelpers.ts";
import { useAppState } from "@/stores/appState.ts";

const MentionList = observer(({ entity }: { entity: Entity }) => {
  return (
    <Stack className={classes.linkList}>
      {entity.mentionLinkList.map((mentionLink) => (
        <MentionLinkEditor
          key={mentionLink.mention.id}
          mention={mentionLink.mention}
        />
      ))}
    </Stack>
  );
});

const EntityEditor = observer(({ entity }: { entity: Entity }) => {
  const appState = useAppState();
  const [name, setName] = useState(entity.name);
  const [changes, setChanges] = useState<NodeAttributes>(entity.attributes);

  function applyChanges() {
    entity.setName(name);
    for (const [attributeName, value] of Object.entries(changes)) {
      entity.setAttributeValue(attributeName, value);
    }
    redrawNode(appState.sigma, entity);
  }

  const canApplyChanges =
    entity.name !== name || hasDifferenceOrAddition(changes, entity.attributes);

  return (
    <Fieldset
      className={sharedClasses.editorFieldset}
      legend={entity.nodeType}
      styles={{
        root: {
          borderColor: entity.color,
        },
        legend: {
          color: entity.color,
        },
      }}
    >
      <Stack gap={10}>
        <TextInput
          label="Name"
          value={name}
          onChange={(event) => {
            setName(event.currentTarget.value);
          }}
          style={{ flexGrow: 1 }}
        />

        <AttributeSelectors
          // nodeSource={entity}
          values={changes}
          attributes={
            entity.dataset.attributeManager.entityProperties
              .nonReservedAttributes
          }
          onSetAttribute={(attribute, value) => {
            setChanges((prevChanges) => ({
              ...prevChanges,
              [attribute.name]: value,
            }));
          }}
        />

        {/*{entity.dataset.attributeManager.entityProperties.attributes.map()}*/}

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
        <MentionList entity={entity} />
      </Stack>
    </Fieldset>
  );
});

export default EntityEditor;
