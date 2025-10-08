import { observer } from "mobx-react";
import classes from "./EntityEditor.module.css";
import sharedClasses from "../shared.module.css";
import {
  Button,
  Combobox,
  Fieldset,
  Input,
  InputBase,
  Stack,
  TextInput,
  useCombobox,
  Divider,
} from "@mantine/core";
import { useState } from "react";
import { IconEdit } from "@tabler/icons-react";
import { DEFINES } from "@/defines.ts";
import { useAppState } from "@/stores/rootStore.ts";
import { typeToColor, typeToString } from "@/utils/helpers.ts";
import MentionLinkEditor from "@/components/RightWidget/MentionLinkEditor.tsx";
import NodeActions from "@/components/RightWidget/NodeActions.tsx";
import type { Entity } from "@/stores/entity.ts";

const entityTypeDropdownOptions = Object.entries(DEFINES.entityTypes.names).map(
  ([tag, name]) => (
    <Combobox.Option value={tag} key={tag}>
      {name}
    </Combobox.Option>
  ),
);

const MentionList = observer(({ entityId }: { entityId: string }) => {
  const rootStore = useAppState();
  const mentions = Array.from(rootStore.dataset.mentions.values()).filter(
    (mention) => mention.entities.has(entityId),
  );

  return (
    <Stack className={classes.linkList}>
      {mentions.map((mention) => (
        <MentionLinkEditor key={mention.id} mention={mention} />
      ))}
    </Stack>
  );
});

const EntityEditor = observer(({ entity }: { entity: Entity }) => {
  const entityTypeCombobox = useCombobox();

  const [name, setName] = useState(entity.name);
  const [entityType, setEntityType] = useState(entity.type);

  function applyChanges() {
    entity.name = name;
    entity.type = entityType;
  }

  const canApplyChanges = entity.name !== name || entity.type !== entityType;

  return (
    <Fieldset
      className={sharedClasses.editorFieldset}
      legend={typeToString(entity.type)}
      styles={{
        root: {
          borderColor: typeToColor(entity.type) ?? undefined,
        },
        legend: {
          color: typeToColor(entity.type) ?? undefined,
        },
      }}
    >
      <NodeActions node={entity} />

      <TextInput
        label="Name"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <Combobox
        store={entityTypeCombobox}
        onOptionSubmit={(val) => {
          setEntityType(val);
          entityTypeCombobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <InputBase
            component="button"
            type="button"
            label="Entity Type"
            pointer
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
            onClick={() => entityTypeCombobox.toggleDropdown()}
          >
            {typeToString(entityType) || (
              <Input.Placeholder>Select Entity Type</Input.Placeholder>
            )}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>{entityTypeDropdownOptions}</Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
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
        <MentionList entityId={entity.id} />
      </Stack>
    </Fieldset>
  );
});

export default EntityEditor;
