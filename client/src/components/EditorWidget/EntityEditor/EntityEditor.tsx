import { observer } from "mobx-react";
import classes from "./EntityEditor.module.css";
import sharedClasses from "../shared.module.css";
import {
  Button,
  Fieldset,
  Stack,
  TextInput,
  useCombobox,
  Divider,
  Group,
} from "@mantine/core";
import { useState } from "react";
import { IconEdit } from "@tabler/icons-react";
import { typeToString } from "@/utils/helpers.ts";
import MentionLinkEditor from "@/components/EditorWidget/MentionLinkEditor.tsx";
import type { Entity } from "@/stores/entity.ts";
import TypeSelectorCombobox from "@/components/EditorWidget/TypeSelectorCombobox.tsx";

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
  const entityTypeCombobox = useCombobox();

  const [name, setName] = useState(entity.name);
  const [entityType, setEntityType] = useState(entity.type);

  function applyChanges() {
    entity.setName(name);
    entity.setType(entityType);
  }

  const canApplyChanges = entity.name !== name || entity.type !== entityType;

  return (
    <Fieldset
      className={sharedClasses.editorFieldset}
      legend={typeToString(entity.type)}
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
        <Group>
          <TextInput
            label="Name"
            value={name}
            onChange={(event) => {
              setName(event.currentTarget.value);
            }}
            style={{ flexGrow: 1 }}
          />
          <TypeSelectorCombobox
            combobox={entityTypeCombobox}
            entityType={entityType}
            setEntityType={setEntityType}
          />
        </Group>

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
