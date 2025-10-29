import { observer } from "mobx-react";
import classes from "./DocumentTextView.module.css";
import { Box, Mark, Title } from "@mantine/core";
import { useAppState } from "@/stores/appState.ts";
import { Document } from "@/stores/document.ts";
import { useEffect, useMemo, useRef } from "react";
import { RichTextEditor, useRichTextEditorContext } from "@mantine/tiptap";
import {
  useEditor,
  Mark as TiptapMark,
  ReactMarkViewRenderer,
  type Editor,
} from "@tiptap/react";
import DocumentExtension from "@tiptap/extension-document";
import TextExtension from "@tiptap/extension-text";
import ParagraphExtension from "@tiptap/extension-paragraph";
import clsx from "clsx";
import { MarkViewContent, type MarkViewRendererProps } from "@tiptap/react";
import globalClasses from "@/styles/global.module.css";
import { typeToColor } from "@/utils/helpers.ts";
import { DEFINES } from "@/defines.ts";
import { IconPencil } from "@tabler/icons-react";
import type { Mention } from "@/stores/mention.ts";
import { useDebouncedCallback } from "@mantine/hooks";

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

const InsertStarControl = () => {
  const appState = useAppState();
  const { editor } = useRichTextEditorContext();
  return (
    <RichTextEditor.Control
      onClick={() => {
        appState.uiState.setDocumentEditMode(
          !appState.uiState.documentEditMode,
        );
        editor?.setEditable(appState.uiState.documentEditMode);
      }}
      aria-label="Edit Document"
      title="Edit Document"
    >
      <IconPencil
        stroke={1.5}
        size={16}
        color={
          appState.uiState.documentEditMode
            ? "var(--mantine-primary-color-filled)"
            : undefined
        }
      />
    </RichTextEditor.Control>
  );
};

const TextViewContents = observer(({ document }: { document: Document }) => {
  const appState = useAppState();
  const initialUpdate = useRef<boolean>(false);

  const updateMentions = useDebouncedCallback((editor: Editor) => {
    if (appState.viewedDocument === null) return;
    appState.viewedDocument.setText(editor.getText());
    editor.state.doc.descendants((node, pos) => {
      node.marks.forEach((mark) => {
        if (mark.type.name !== ClickableMark.name || node.text === undefined) {
          return;
        }
        const mention = mark.attrs.mention as Mention;
        const startIndex = pos - 1;
        const endIndex = startIndex + node.text.length;
        if (
          mention.start_index === startIndex &&
          mention.end_index === endIndex
        ) {
          return;
        }
        mention.setIndices(startIndex, endIndex);
      });
    });
  }, 500);

  const editor = useEditor({
    extensions: [
      DocumentExtension,
      TextExtension,
      ParagraphExtension,
      ClickableMark,
    ],
    editable: appState.uiState.documentEditMode,
    onUpdate({ editor }) {
      if (initialUpdate.current) {
        initialUpdate.current = false;
        return;
      }
      updateMentions(editor);
    },
  });

  useEffect(() => {
    if (!editor) return;
    initialUpdate.current = true;
    // console.log("Setting content");
    editor.commands.setContent(`<text>${document.text}</text>`);
    queueMicrotask(() => {
      editor.chain().focus();

      const { state, view } = editor;
      const tr = state.tr;

      document.mentionList.forEach((m) => {
        const markType = state.schema.marks.clickableHighlight;
        if (!markType) return;

        tr.addMark(
          m.start_index + 1,
          m.end_index + 1,
          markType.create({ mention: m }),
        );
      });
      // console.log("Calling dispatch");

      view.dispatch(tr);
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
        classNames={{
          content: classes.content,
          root: classes.editorRoot,
          Typography: classes.editorTypography,
        }}
        editor={editor}
      >
        <RichTextEditor.Toolbar sticky stickyOffset={0}>
          <InsertStarControl />
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content />
      </RichTextEditor>
    </>
  );
});

const DocumentTextView = observer(() => {
  const appState = useAppState();
  // const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);
  //
  // function onTransitionStart() {
  //   setIsTransitionActive(true);
  // }
  //
  // function onTransitionEnd() {
  //   setIsTransitionActive(false);
  //   appState.sigma?.refresh();
  // }

  return (
    <Box
      className={classes.textView}
      style={{
        width: appState.viewedDocument !== null ? 300 : 0,
        padding: appState.viewedDocument !== null ? 20 : 0,
      }}
      // onTransitionStart={onTransitionStart}
      // onTransitionEnd={onTransitionEnd}
      // style={{
      //   width: 300,
      //   padding: 20,
      // }}
    >
      {appState.viewedDocument !== null && (
        <TextViewContents document={appState.viewedDocument} />
      )}
    </Box>
  );
});

export default DocumentTextView;
