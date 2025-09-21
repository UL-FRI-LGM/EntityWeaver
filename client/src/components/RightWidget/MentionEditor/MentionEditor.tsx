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
import {
  type LinkInstance,
  type MentionInstance,
  useMst,
} from "@/stores/rootStore.ts";
import SearchableCombobox from "../../SearchableCombobox/SearchableCombobox.tsx";
import { typeToColor, typeToString } from "@/utils/helpers.ts";

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
    onDocumentChange: (_id: string) => void;
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
        placeholder={"Select Document"}
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
    onEntityChange: (_id: string) => void;
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
        textInputProps={{ style: { flex: 1 } }}
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
  const rootStore = useMst();
  const entityTypeCombobox = useCombobox();

  const [name, setName] = useState(mention.name);
  const [entityType, setEntityType] = useState(mention.type);
  const [documentId, setDocumentId] = useState(mention.documentId);
  const [entityId, setEntityId] = useState<string | null>(null);

  function applyChanges() {
    mention.setName(name);
    mention.setType(entityType);
    mention.setDocumentId(documentId);
  }

  function setLinkedEntity() {
    if (entityId === null) return;
    mention.setEntityLink(entityId, !rootStore.holdingShift);
  }

  const canApplyChanges =
    mention.name !== name ||
    mention.type !== entityType ||
    mention.documentId !== documentId;

  const canAddEntity =
    entityId !== null &&
    (!mention.entityLinks.has(entityId) || rootStore.holdingShift);

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
