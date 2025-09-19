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
import { Fieldset, Stack, Text, TextInput } from "@mantine/core";
import { getType } from "mobx-state-tree";
import { useState } from "react";
import { typeToColor, typeToString } from "../../utils/helpers.ts";

const EntityEditor = observer(({ entity }: { entity: EntityInstance }) => {
  const [name, setName] = useState(entity.name);
  return (
    <Stack>
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
        <TextInput label="Entity Type" placeholder="Email" mt="md" />
        <TextInput label="Document" placeholder="Email" mt="md" />
      </Fieldset>
      {/*<Text className={classes.entityEntry}>*/}
      {/*  <img*/}
      {/*    className={classes.entityIcon}*/}
      {/*    src="/person.svg"*/}
      {/*    alt="icon title"*/}
      {/*  />*/}
      {/*  {entity.name}*/}
      {/*</Text>*/}

      {/*<Text>{entity.type}</Text>*/}
    </Stack>
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
