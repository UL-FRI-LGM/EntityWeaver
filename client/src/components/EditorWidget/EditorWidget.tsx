import { observer } from "mobx-react";
import { type NodeSource, useAppState } from "@/stores/appState.ts";
import classes from "./EditorWidget.module.css";
import MentionEditor from "./MentionEditor/MentionEditor.tsx";
import DocumentEditor from "./DocumentEditor/DocumentEditor.tsx";
import EntityEditor from "@/components/EditorWidget/EntityEditor/EntityEditor.tsx";
import { Mention } from "@/stores/mention.ts";
import { Entity } from "@/stores/entity.ts";
import { Document } from "@/stores/document.ts";

function NodeEditor({ node }: { node: NodeSource }) {
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

const EditorWidget = observer(() => {
  const appState = useAppState();

  return (
    <div className={classes.container}>
      {appState.selectedNodeInstance && (
        <NodeEditor node={appState.selectedNodeInstance} />
      )}
    </div>
  );
});

export default EditorWidget;
