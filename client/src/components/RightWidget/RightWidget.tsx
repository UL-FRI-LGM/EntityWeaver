import { observer } from "mobx-react";
import {
  Document,
  type DocumentInstance,
  Mention,
  Entity,
  type EntityInstance,
  type MentionInstance,
  useMst,
  type LinkInstance,
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
  Text,
  Paper,
  Divider,
  ActionIcon,
  Group,
} from "@mantine/core";
import { getType } from "mobx-state-tree";
import { useState } from "react";
import { DEFINES } from "../../defines.ts";
import { IconEdit, IconX } from "@tabler/icons-react";
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

const EntitySelector = observer(
  ({
    entityId,
    onEntityChange,
    label,
  }: {
    entityId: string | null;
    onEntityChange: (id: string) => void;
    label: string;
  }) => {
    const { dataset } = useMst();

    const selectedEntity = entityId
      ? dataset.entities.get(entityId)
      : undefined;

    const [searchValue, setSearchValue] = useState(
      selectedEntity?.searchString ?? "",
    );

    const shouldFilterOptions = selectedEntity?.searchString !== searchValue;

    const filteredOptions = shouldFilterOptions
      ? dataset.entityList.filter((entity) =>
          entity.searchString
            .toLowerCase()
            .includes(searchValue.toLowerCase().trim()),
        )
      : dataset.entityList;

    const options = filteredOptions.map((item) => ({
      val: item.id,
      display: item.searchString,
    }));

    return (
      <SearchableCombobox
        label={label}
        selectedValue={selectedEntity?.searchString}
        onChange={onEntityChange}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        options={options}
      />
    );
  },
);

const LinkEditor = observer(({ link }: { link: LinkInstance }) => {
  return (
    <Paper className={classes.linkEntry} shadow="xl" withBorder>
      <Group justify="space-between">
        <Text truncate="end" component="span">
          {link.entity.name}
        </Text>
        <ActionIcon variant="default">
          <IconX onClick={() => link.remove()} />
        </ActionIcon>
      </Group>
    </Paper>
  );
});

const EntityLinkList = observer(({ links }: { links: LinkInstance[] }) => {
  return (
    <Stack>
      {links.map((link) => (
        <LinkEditor key={link.entity.id} link={link} />
      ))}
    </Stack>
  );
});

const MentionToEntityLinkEditor = observer(
  ({ mention }: { mention: MentionInstance }) => {
    return (
      <Fieldset
        legend={"Linked Entities"}
        className={classes.linkedEntitiesContainer}
      >
        <EntityLinkList links={mention.entityLinkList} />
      </Fieldset>
    );
  },
);

const MentionEditor = observer(({ mention }: { mention: MentionInstance }) => {
  const entityTypeCombobox = useCombobox();

  const [name, setName] = useState(mention.name);
  const [entityType, setEntityType] = useState(mention.type);
  const [documentId, setDocumentId] = useState(mention.documentId);

  function applyChanges() {
    mention.setName(name);
    mention.setType(entityType);
    mention.setDocumentId(documentId);
  }

  const canApplyChanges =
    mention.name !== name ||
    mention.type !== entityType ||
    mention.documentId !== documentId;

  return (
    <Fieldset
      className={classes.fieldset}
      legend={typeToString(mention.type)}
      styles={{
        root: {
          borderColor: typeToColor(mention.type) ?? undefined,
        },
        legend: {
          color: typeToColor(mention.type) ?? undefined,
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
      {/*<EntitySelector*/}
      {/*  label={"Entity"}*/}
      {/*  entityId={mention.entity_id ?? null}*/}
      {/*  onEntityChange={(id) => {*/}
      {/*    mention.setEntityId(id);*/}
      {/*  }}*/}
      {/*/>*/}
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
      <Divider />
      <MentionToEntityLinkEditor mention={mention} />
    </Fieldset>
  );
});

const DocumentEditor = observer(
  ({ document }: { document: DocumentInstance }) => {
    return <Stack>{document.id}</Stack>;
  },
);

const EntityEditor = observer(({ entity }: { entity: EntityInstance }) => {
  return <Stack>{entity.id}</Stack>;
});

const RightWidget = observer(() => {
  const rootStore = useMst();

  function NodeEditor() {
    const node = rootStore.selectedNodeInstance;
    if (!node) return null;

    if (getType(node) === Mention) {
      return <MentionEditor mention={node as MentionInstance} />;
    }
    if (getType(node) === Document) {
      return <DocumentEditor document={node as DocumentInstance} />;
    }
    if (getType(node) === Entity) {
      return <EntityEditor entity={node as EntityInstance} />;
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
