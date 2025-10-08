import { observer } from "mobx-react";
import classes from "./MentionEditor.module.css";
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
  Tooltip,
  Code,
} from "@mantine/core";
import { useState } from "react";
import { IconEdit, IconLink, IconLinkPlus, IconX } from "@tabler/icons-react";
import { DEFINES } from "@/defines.ts";
import { useAppState } from "@/stores/rootStore.ts";
import SearchableCombobox, {
  type SearchableComboboxOption,
} from "../../SearchableCombobox/SearchableCombobox.tsx";
import { typeToColor, typeToString } from "@/utils/helpers.ts";
import sharedClasses from "../shared.module.css";
import NodeActions from "@/components/RightWidget/NodeActions.tsx";
import type { Mention } from "@/stores/mention.ts";
import type { Entity } from "@/stores/entity.ts";

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
    documentId: string;
    onDocumentChange: (_id: string) => void;
    label: string;
  }) => {
    const rootStore = useAppState();
    const { dataset, setSelectedNode } = useAppState();

    const selectedDocument = dataset.documents.get(documentId);

    const [searchValue, setSearchValue] = useState(
      selectedDocument?.title ?? "",
    );

    const shouldFilterOptions = selectedDocument?.title !== searchValue;

    const filteredOptions = shouldFilterOptions
      ? dataset.documentList.filter((doc) =>
          doc.title.toLowerCase().includes(searchValue.toLowerCase().trim()),
        )
      : dataset.documentList;

    const options: SearchableComboboxOption[] = filteredOptions.map((doc) => ({
      val: doc.id,
      display: doc.title,
      props: {
        onMouseEnter: () => rootStore.setUiHoveredNode(doc.id),
        onMouseLeave: () => rootStore.setUiHoveredNode(null),
      },
    }));

    return (
      <Group align="end" justify="space-between" gap={10}>
        <SearchableCombobox
          label={label}
          placeholder={"Select Document"}
          selectedValue={selectedDocument?.title}
          onChange={onDocumentChange}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          options={options}
          textInputProps={{
            style: { flex: 1 },
            onMouseEnter: () => rootStore.setUiHoveredNode(documentId),
            onMouseLeave: () => rootStore.setUiHoveredNode(null),
          }}
        />
        <Tooltip label={"Open Document Editor"}>
          <ActionIcon
            size={36}
            variant="default"
            onClick={() => setSelectedNode(documentId)}
          >
            <IconEdit />
          </ActionIcon>
        </Tooltip>
      </Group>
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
    onEntityChange: (_id: string) => void;
    label: string;
  }) => {
    const rootStore = useAppState();

    const selectedEntity = entityId
      ? rootStore.dataset.entities.get(entityId)
      : undefined;

    const [searchValue, setSearchValue] = useState(
      selectedEntity?.searchString ?? "",
    );

    const shouldFilterOptions = selectedEntity?.searchString !== searchValue;

    const filteredOptions = shouldFilterOptions
      ? rootStore.dataset.entityList.filter((entity) =>
          entity.searchString
            .toLowerCase()
            .includes(searchValue.toLowerCase().trim()),
        )
      : rootStore.dataset.entityList;

    const options: SearchableComboboxOption[] = filteredOptions.map((item) => ({
      val: item.id,
      display: item.searchString,
      props: {
        onMouseEnter: () => rootStore.setUiHoveredNode(item.id),
        onMouseLeave: () => rootStore.setUiHoveredNode(null),
      },
    }));

    function onChange(id: string) {
      onEntityChange(id);
    }

    return (
      <SearchableCombobox
        label={label}
        selectedValue={selectedEntity?.searchString}
        onChange={onChange}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        options={options}
        textInputProps={{
          style: { flex: 1 },
          onMouseEnter: () => rootStore.setUiHoveredNode(entityId),
          onMouseLeave: () => rootStore.setUiHoveredNode(null),
        }}
      />
    );
  },
);

const LinkEditor = observer(
  ({ mention, link }: { mention: Mention; link: Entity }) => {
    const rootStore = useAppState();

    return (
      <Paper
        className={classes.linkEntry}
        shadow="xl"
        withBorder
        onMouseEnter={() => rootStore.setUiHoveredNode(link.id)}
        onMouseLeave={() => rootStore.setUiHoveredNode(null)}
      >
        <Group
          wrap={"nowrap"}
          justify="space-between"
          gap={0}
          onMouseEnter={() => rootStore.setUiHoveredNode(link.id)}
          onMouseLeave={() => rootStore.setUiHoveredNode(null)}
        >
          <Text truncate="end" component="span" className={classes.linkText}>
            {link.name}
          </Text>
          <ActionIcon variant="default">
            <IconX onClick={() => mention.removeEntityLink(link.id)} />
          </ActionIcon>
        </Group>
      </Paper>
    );
  },
);

const EntityLinkList = observer(({ mention }: { mention: Mention }) => {
  return (
    <Stack className={classes.linkList}>
      {mention.entityLinkList.map((link) => (
        <LinkEditor key={link.id} mention={mention} link={link} />
      ))}
    </Stack>
  );
});

const MentionToEntityLinkEditor = observer(
  ({ mention }: { mention: Mention }) => {
    return (
      <Fieldset
        legend={"Linked Entities"}
        className={classes.linkedEntitiesContainer}
      >
        <EntityLinkList mention={mention} />
      </Fieldset>
    );
  },
);

const MentionEditor = observer(({ mention }: { mention: Mention }) => {
  const rootStore = useAppState();
  const entityTypeCombobox = useCombobox();

  const [name, setName] = useState(mention.name);
  const [entityType, setEntityType] = useState(mention.type);
  const [documentId, setDocumentId] = useState<string>(mention.document.id);
  const [entityId, setEntityId] = useState<string | null>(null);

  function applyChanges() {
    mention.setName(name);
    mention.setType(entityType);
    const document = documentId
      ? rootStore.dataset.documents.get(documentId)
      : null;
    if (document) {
      mention.setDocument(document);
    }
  }

  function setLinkedEntity() {
    if (entityId === null) return;
    mention.setEntityLink(entityId, !rootStore.holdingShift);
  }

  const canApplyChanges =
    mention.name !== name ||
    mention.type !== entityType ||
    mention.document.id !== documentId;

  const canAddEntity =
    entityId !== null &&
    (!mention.entities.has(entityId) || rootStore.holdingShift);

  return (
    <Fieldset
      className={sharedClasses.editorFieldset}
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
      <NodeActions node={mention} />
      <Stack gap={10}>
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
        <Button
          disabled={!canApplyChanges}
          variant="filled"
          leftSection={<IconEdit size={14} />}
          onClick={applyChanges}
          className={sharedClasses.applyChangesButton}
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
      </Stack>

      <Divider />
      <Stack gap="10px">
        <Group
          preventGrowOverflow={false}
          wrap="nowrap"
          align={"end"}
          gap={12}
          justify="space-between"
        >
          <EntitySelector
            label={
              rootStore.holdingShift ? "Set Linked Entity" : "Add Linked Entity"
            }
            entityId={entityId}
            onEntityChange={(id) => {
              setEntityId(id);
            }}
          />
          <Tooltip
            position="bottom"
            label={
              <Text style={{ maxWidth: 220, textWrap: "wrap" }}>
                Link a Mention to an Entity. Hold{" "}
                <Code color="gray.5">SHIFT</Code> to overwrite all current
                links.
              </Text>
            }
          >
            <ActionIcon
              size={36}
              disabled={!canAddEntity}
              onClick={setLinkedEntity}
            >
              {rootStore.holdingShift ? (
                <IconLink size={28} />
              ) : (
                <IconLinkPlus size={28} />
              )}
            </ActionIcon>
          </Tooltip>
        </Group>
        <MentionToEntityLinkEditor mention={mention} />
      </Stack>
    </Fieldset>
  );
});

export default MentionEditor;
