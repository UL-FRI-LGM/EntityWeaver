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
import { DEFINES } from "../../defines.ts";
import { IconEdit } from "@tabler/icons-react";
import { typeToColor, typeToString } from "../../utils/helpers.ts";
import SearchableCombobox from "../SearchableCombobox/SearchableCombobox.tsx";

const entityTypeDropdownOptions = Object.entries(DEFINES.entityTypes.names).map(
  ([tag, name]) => (
    <Combobox.Option value={tag} key={tag}>
      {name}
    </Combobox.Option>
  ),
);

const DocumentSelector = observer(
  ({
    documentId,
    onDocumentChange,
    label,
  }: {
    documentId: string | null;
    onDocumentChange: (id: string) => void;
    label: string;
  }) => {
    const { dataset } = useMst();

    const selectedDocument = documentId
      ? dataset.documents.get(documentId)
      : null;

    const [searchValue, setSearchValue] = useState(
      selectedDocument?.title ?? "",
    );

    const shouldFilterOptions = selectedDocument?.title !== searchValue;

    const filteredOptions = shouldFilterOptions
      ? dataset.documentList.filter((doc) =>
          doc.title.toLowerCase().includes(searchValue.toLowerCase().trim()),
        )
      : dataset.documentList;

    const options = filteredOptions.map((doc) => ({
      val: doc.id,
      display: doc.title,
    }));

    return (
      <SearchableCombobox
        label={label}
        selectedValue={selectedDocument?.title}
        onChange={onDocumentChange}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        options={options}
      />
    );
  },
);

const EntityGroupSelector = observer(
  ({
    groupId,
    onGroupChange,
    label,
  }: {
    groupId: string | null;
    onGroupChange: (id: string) => void;
    label: string;
  }) => {
    const { dataset } = useMst();

    const selectedGroup = groupId
      ? dataset.entityGroups.get(groupId)
      : undefined;

    const [searchValue, setSearchValue] = useState(
      selectedGroup?.searchString ?? "",
    );

    const shouldFilterOptions = selectedGroup?.searchString !== searchValue;

    const filteredOptions = shouldFilterOptions
      ? dataset.groupList.filter((group) =>
          group.searchString
            .toLowerCase()
            .includes(searchValue.toLowerCase().trim()),
        )
      : dataset.groupList;

    const options = filteredOptions.map((item) => ({
      val: item.id,
      display: item.searchString,
    }));

    return (
      <SearchableCombobox
        label={label}
        selectedValue={selectedGroup?.searchString}
        onChange={onGroupChange}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        options={options}
      />
    );
  },
);

const EntityEditor = observer(({ entity }: { entity: EntityInstance }) => {
  const entityTypeCombobox = useCombobox();

  const [name, setName] = useState(entity.name);
  const [entityType, setEntityType] = useState(entity.type);
  const [documentId, setDocumentId] = useState(entity.document_id);

  function applyChanges() {
    entity.setName(name);
    entity.setType(entityType);
    entity.setDocumentId(documentId);
  }

  const canApplyChanges =
    entity.name !== name ||
    entity.type !== entityType ||
    entity.document_id !== documentId;

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
      <DocumentSelector
        label={"Source Document"}
        documentId={documentId}
        onDocumentChange={(id) => {
          setDocumentId(id);
        }}
      />
      <EntityGroupSelector
        label={"Entity"}
        groupId={entity.group_id ?? null}
        onGroupChange={(id) => {
          entity.setGroupId(id);
        }}
      />
      <Button
        disabled={!canApplyChanges}
        variant="filled"
        leftSection={<IconEdit size={14} />}
        onClick={applyChanges}
        className={classes.applyChangesButton}
      >
        Apply Changes
      </Button>
      {/* TODO disable tooltip if you just clicked apply changes until you move mouse */}
      {/*<Tooltip*/}
      {/*  position="bottom"*/}
      {/*  disabled={canApplyChanges}*/}
      {/*  label="No changes to apply"*/}
      {/*  openDelay={2000}*/}
      {/*>*/}
      {/*  <Button*/}
      {/*    disabled={!canApplyChanges}*/}
      {/*    variant="filled"*/}
      {/*    leftSection={<IconEdit size={14} />}*/}
      {/*    onClick={applyChanges}*/}
      {/*    className={classes.applyChangesButton}*/}
      {/*  >*/}
      {/*    Apply Changes*/}
      {/*  </Button>*/}
      {/*</Tooltip>*/}
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
