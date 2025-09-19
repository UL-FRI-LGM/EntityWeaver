import { observer } from "mobx-react";
import {
  Document,
  type DocumentInstance,
  Entity,
  EntityGroup,
  type EntityGroupInstance,
  type EntityInstance,
  useMst,
} from "../../stores/rootStore.ts";
import classes from "./RightWidget.module.css";
import {
  Button,
  Combobox,
  Fieldset,
  Input,
  InputBase,
  Stack,
  TextInput,
  useCombobox,
} from "@mantine/core";
import { getType } from "mobx-state-tree";
import { useState } from "react";
import { typeToColor, typeToString } from "../../utils/helpers.ts";
import { DEFINES } from "../../defines.ts";
import { IconEdit } from "@tabler/icons-react";

const entityTypeDropdownOptions = Object.entries(DEFINES.entityTypes.names).map(
  ([tag, name]) => (
    <Combobox.Option value={tag} key={tag}>
      {name}
    </Combobox.Option>
  ),
);

const EntityEditor = observer(({ entity }: { entity: EntityInstance }) => {
  const entityTypeCombobox = useCombobox();

  const [name, setName] = useState(entity.name);
  const [entityType, setEntityType] = useState(entity.type);

  function applyChanges() {
    entity.setName(name);
    entity.setType(entityType);
  }

  return (
    <Fieldset
      className={classes.fieldset}
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
      <TextInput label="Document" placeholder="Email" mt="md" />
      <Button
        disabled={entity.name === name && entity.type === entityType}
        variant="filled"
        leftSection={<IconEdit size={14} />}
        onClick={applyChanges}
      >
        Apply Changes
      </Button>
    </Fieldset>
  );
});

const DocumentEditor = observer(
  ({ document }: { document: DocumentInstance }) => {
    return <Stack>{document.id}</Stack>;
  },
);

const EntityGroupEditor = observer(
  ({ group }: { group: EntityGroupInstance }) => {
    return <Stack>{group.id}</Stack>;
  },
);

const RightWidget = observer(() => {
  const rootStore = useMst();

  function NodeEditor() {
    const node = rootStore.selectedNodeInstance;
    if (!node) return null;

    if (getType(node) === Entity) {
      return <EntityEditor entity={node as EntityInstance} />;
    }
    if (getType(node) === Document) {
      return <DocumentEditor document={node as DocumentInstance} />;
    }
    if (getType(node) === EntityGroup) {
      return <EntityGroupEditor group={node as EntityGroupInstance} />;
    }
  }

  return (
    <div className={classes.container}>
      {/*<h4>Selected Entity</h4>*/}
      {rootStore.selectedNodeInstance && <NodeEditor />}
    </div>
  );
});

export default RightWidget;
