import { observer } from "mobx-react";
import {
  Document,
  type DocumentInstance,
  Mention,
  Entity,
  type EntityInstance,
  type MentionInstance,
  useMst,
} from "@/stores/rootStore.ts";
import classes from "./RightWidget.module.css";
import { getType } from "mobx-state-tree";
import MentionEditor from "./MentionEditor/MentionEditor.tsx";
import DocumentEditor from "./DocumentEditor/DocumentEditor.tsx";
import EntityEditor from "@/components/RightWidget/EntityEditor/EntityEditor.tsx";

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
