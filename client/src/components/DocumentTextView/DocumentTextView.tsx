import { observer } from "mobx-react";
import classes from "./DocumentTextView.module.css";
import { Box, Mark, Title } from "@mantine/core";
import { useAppState } from "@/stores/appState.ts";
import { Document } from "@/stores/document.ts";
import { useEffect, useMemo, useRef, useState } from "react";
import { RichTextEditor } from "@mantine/tiptap";
import {
  useEditor,
  Mark as TiptapMark,
  ReactMarkViewRenderer,
} from "@tiptap/react";
import DocumentExtension from "@tiptap/extension-document";
import TextExtension from "@tiptap/extension-text";
import ParagraphExtension from "@tiptap/extension-paragraph";
import clsx from "clsx";
import { MarkViewContent, type MarkViewRendererProps } from "@tiptap/react";
import globalClasses from "@/styles/global.module.css";
import { typeToColor } from "@/utils/helpers.ts";
import { DEFINES } from "@/defines.ts";

const ClickableMarkComponent = observer((props: MarkViewRendererProps) => {
  const appState = useAppState();
  const markRef = useRef<HTMLElement | null>(null);

  const color =
    typeToColor(props.mark.attrs.mention.type) ??
    "var(--mantine-primary-color-filled)";

  const outline = useMemo(() => {
    if (appState.selectedNode === props.mark.attrs.mention.id) {
      return `${DEFINES.selection.borderColor} 2px solid`;
    }
    if (
      appState.hoveredNode === props.mark.attrs.mention.id ||
      appState.uiHoveredNode === props.mark.attrs.mention.id
    ) {
      return `${DEFINES.uiHover.borderColor} 2px solid`;
    }
    return 0;
  }, [appState.hoveredNode, appState.uiHoveredNode, appState.selectedNode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Mark
      ref={markRef}
      className={clsx(globalClasses.mark, classes.textEntity)}
      style={{
        outline: outline,
      }}
      color={color}
      onClick={() => {
        appState.setSelectedNode(props.mark.attrs.mention.id);
      }}
      onMouseEnter={() => {
        appState.setUiHoveredNode(props.mark.attrs.mention.id);
      }}
      onMouseLeave={() => {
        appState.setUiHoveredNode(null);
      }}
    >
      <MarkViewContent />
    </Mark>
  );
});

const ClickableMark = TiptapMark.create({
  name: "clickableHighlight",

  addAttributes() {
    return {
      mention: { default: null, rendered: false },
    };
  },

  parseHTML() {
    return [{ tag: "react-component" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["react-component", HTMLAttributes];
  },

  addMarkView() {
    return ReactMarkViewRenderer(ClickableMarkComponent);
  },
});

const TextViewContents = observer(({ document }: { document: Document }) => {
  const editor = useEditor({
    extensions: [
      DocumentExtension,
      TextExtension,
      ParagraphExtension,
      ClickableMark,
    ],
    editable: false,
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(document.text);
    queueMicrotask(() => {
      document.mentionList.forEach((m) => {
        editor
          .chain()
          .setTextSelection({ from: m.start_index + 1, to: m.end_index + 1 })
          .setMark("clickableHighlight", { mention: m })
          .run();
      });
    });
  }, [document, editor]);

  return (
    <>
      <Title order={2} textWrap="balance">
        {document.title}
      </Title>
      <RichTextEditor
        variant="subtle"
        className={classes.editor}
        classNames={{ content: classes.content }}
        editor={editor}
      >
        <RichTextEditor.Content />
      </RichTextEditor>
    </>
  );
});

const DocumentTextView = observer(() => {
  const appState = useAppState();
  const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);

  function onTransitionStart() {
    setIsTransitionActive(true);
  }

  function onTransitionEnd() {
    setIsTransitionActive(false);
    appState.sigma?.refresh();
  }

  return (
    <Box
      className={classes.textView}
      style={{
        width: appState.viewedDocument !== null ? 300 : 0,
        padding: appState.viewedDocument !== null ? 20 : 0,
      }}
      onTransitionStart={onTransitionStart}
      onTransitionEnd={onTransitionEnd}
    >
      {!isTransitionActive && appState.viewedDocument !== null && (
        <TextViewContents document={appState.viewedDocument} />
      )}
    </Box>
  );
});

export default DocumentTextView;
