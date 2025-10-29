import { observer } from "mobx-react";
import { useAppState } from "@/stores/appState.ts";
import classes from "./RightWidget.module.css";
import MentionEditor from "./MentionEditor/MentionEditor.tsx";
import DocumentEditor from "./DocumentEditor/DocumentEditor.tsx";
import EntityEditor from "@/components/RightWidget/EntityEditor/EntityEditor.tsx";
import { Mention } from "@/stores/mention.ts";
import { Entity } from "@/stores/entity.ts";
import { Document } from "@/stores/document.ts";

const RightWidget = observer(() => {
  const appState = useAppState();

  function NodeEditor() {
    const node = appState.selectedNodeInstance;
    if (!node) return null;

    if (node instanceof Mention) {
      return <MentionEditor mention={node} />;
    }
    if (node instanceof Document) {
      return <DocumentEditor document={node} />;
    }
    if (node instanceof Entity) {
      return <EntityEditor entity={node} />;
    }
  }

  return (
    <div className={classes.container}>
      {/*<h4>Selected Entity</h4>*/}
      {appState.selectedNodeInstance && <NodeEditor />}
    </div>
  );
});

export default RightWidget;
