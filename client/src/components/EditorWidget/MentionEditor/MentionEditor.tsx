import { observer } from "mobx-react";
import classes from "./MentionEditor.module.css";
import {
  Button,
  Fieldset,
  Stack,
  TextInput,
  Text,
  Paper,
  Divider,
  ActionIcon,
  Group,
  Tooltip,
  Code,
} from "@mantine/core";
import { useState } from "react";
import {
  IconEdit,
  IconFileExport,
  IconLink,
  IconLinkPlus,
  IconX,
} from "@tabler/icons-react";
import { useAppState } from "@/stores/appState.ts";
import SearchableCombobox, {
  type SearchableComboboxOption,
} from "../../SearchableCombobox/SearchableCombobox.tsx";
import sharedClasses from "../shared.module.css";
import { type Mention } from "@/stores/mention.ts";
import type { EntityLink } from "@/stores/entityLink.ts";
import { hasDifferenceOrAddition } from "@/utils/helpers.ts";
import type { NodeAttributes } from "@/utils/schemas.ts";
import AttributeSelectors from "@/components/AttributeSelectors/AttributeSelectors.tsx";
import { redrawNode } from "@/utils/graphHelpers.ts";

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
    const appState = useAppState();

    const selectedEntity = entityId
      ? appState.dataset.entities.get(entityId)
      : undefined;

    const options: SearchableComboboxOption[] = appState.dataset.entityList.map(
      (item) => ({
        val: item.id,
        display: item.searchString,
        props: {
          onMouseEnter: () => {
            appState.setUiHoveredNode(item.id);
          },
          onMouseLeave: () => {
            appState.setUiHoveredNode(null);
          },
        },
      }),
    );

    function onChange(id: string) {
      onEntityChange(id);
    }

    return (
      <SearchableCombobox
        label={label}
        selectedValue={selectedEntity?.searchString}
        onChange={onChange}
        options={options}
        textInputProps={{
          style: { flex: 1 },
          onMouseEnter: () => {
            appState.setUiHoveredNode(entityId);
          },
          onMouseLeave: () => {
            appState.setUiHoveredNode(null);
          },
        }}
      />
    );
  },
);

const LinkEditor = observer(({ link }: { link: EntityLink }) => {
  const appState = useAppState();

  return (
    <Paper
      className={classes.linkEntry}
      shadow="xl"
      withBorder
      onMouseEnter={() => {
        appState.setUiHoveredNode(link.entity.id);
      }}
      onMouseLeave={() => {
        appState.setUiHoveredNode(null);
      }}
    >
      <Group
        wrap={"nowrap"}
        justify="space-between"
        gap={0}
        onMouseEnter={() => {
          appState.setUiHoveredNode(link.entity.id);
        }}
        onMouseLeave={() => {
          appState.setUiHoveredNode(null);
        }}
      >
        <Text truncate="end" component="span" className={classes.linkText}>
          {link.entity.name}
        </Text>
        <ActionIcon variant="default">
          <IconX
            onClick={() => {
              link.delete();
            }}
          />
        </ActionIcon>
      </Group>
    </Paper>
  );
});

const MentionToEntityLinkEditor = observer(
  ({ mention }: { mention: Mention }) => {
    return (
      <Fieldset
        legend={"Linked Entities"}
        className={classes.linkedEntitiesContainer}
      >
        <Stack className={classes.linkList}>
          {mention.entityLinkList.map((link) => (
            <LinkEditor key={link.entity.id} link={link} />
          ))}
        </Stack>
      </Fieldset>
    );
  },
);

const MentionEditor = observer(({ mention }: { mention: Mention }) => {
  const appState = useAppState();

  const [name, setName] = useState(mention.name);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [changes, setChanges] = useState<NodeAttributes>(mention.attributes);

  function applyChanges() {
    mention.setName(name);
    for (const [attributeName, value] of Object.entries(changes)) {
      mention.setAttributeValue(attributeName, value);
    }
    redrawNode(appState.sigma, mention);
  }

  function setLinkedEntity() {
    if (entityId === null) return;
    mention.setEntityLink(entityId, !appState.holdingShift);
  }

  const canApplyChanges =
    mention.name !== name ||
    hasDifferenceOrAddition(changes, mention.attributes);

  const canAddEntity =
    entityId !== null &&
    (!mention.entityLinks.has(entityId) || appState.holdingShift);

  return (
    <Fieldset
      className={sharedClasses.editorFieldset}
      legend={mention.nodeType}
      styles={{
        root: {
          borderColor: mention.color,
        },
        legend: {
          color: mention.color,
        },
      }}
    >
      {/*<NodeActions node={mention} />*/}
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
            mention.dataset.attributeManager.mentionProperties
              .nonReservedAttributes
          }
          onSetAttribute={(attribute, value) => {
            setChanges((prevChanges) => ({
              ...prevChanges,
              [attribute.name]: value,
            }));
          }}
        />
        <Group>
          <Button
            disabled={!canApplyChanges}
            variant="filled"
            leftSection={<IconEdit size={14} />}
            onClick={applyChanges}
            className={sharedClasses.applyChangesButton}
          >
            Apply Changes
          </Button>
          <Tooltip label={"Open Document Editor"}>
            <ActionIcon
              size={36}
              variant="default"
              onClick={() => {
                appState.setSelectedNode(mention.document.id);
              }}
            >
              <IconFileExport />
            </ActionIcon>
          </Tooltip>
        </Group>
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
      {/*<ContextView mention={mention} />*/}
      <div>
        <Divider label="Linked Entities" />
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
                appState.holdingShift
                  ? "Set Linked Entity"
                  : "Add Linked Entity"
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
                {appState.holdingShift ? (
                  <IconLink size={28} />
                ) : (
                  <IconLinkPlus size={28} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
          <MentionToEntityLinkEditor mention={mention} />
        </Stack>
      </div>
    </Fieldset>
  );
});

export default MentionEditor;
