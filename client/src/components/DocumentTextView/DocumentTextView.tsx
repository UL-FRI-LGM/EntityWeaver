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
import { DEFINES } from "@/defines.ts";
import { IconPencil } from "@tabler/icons-react";
import type { Mention } from "@/stores/mention.ts";
import { useDebouncedCallback } from "@mantine/hooks";
import { getMarkType } from "@tiptap/core";

const ClickableMarkComponent = observer((props: MarkViewRendererProps) => {
  const appState = useAppState();
  const markRef = useRef<HTMLElement | null>(null);

  const mention = props.mark.attrs.mention as Mention;

  const outline = useMemo(() => {
    if (appState.selectedNode === mention.id) {
      return `${DEFINES.selection.borderColor} 2px solid`;
    }
    if (
      appState.hoveredNode === mention.id ||
      appState.uiHoveredNode === mention.id
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
      color={mention.color}
      onClick={() => {
        appState.setSelectedNode(mention.id);
      }}
      onMouseEnter={() => {
        appState.setUiHoveredNode(mention.id);
      }}
      onMouseLeave={() => {
        appState.setUiHoveredNode(null);
      }}
    >
      <MarkViewContent />
    </Mark>
  );
});

// const clickableMarkTypeName = "clickableHighlight";
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
  const blockNextMentionRerender = useRef<boolean>(false);
  const blockNextMentionUpdate = useRef<boolean>(false);

  const editor = useEditor({
    extensions: [
      DocumentExtension,
      TextExtension,
      ParagraphExtension,
      ClickableMark,
    ],
    editable: appState.uiState.documentEditMode,
    onUpdate({ editor }) {
      // Block here since updateMentions is debounced
      if (blockNextMentionUpdate.current) {
        blockNextMentionUpdate.current = false;
        return;
      }
      updateMentions(editor);
    },
  });

  const updateMentions = useDebouncedCallback((editor: Editor) => {
    if (appState.viewedDocument === null) {
      return;
    }
    blockNextMentionRerender.current = true;
    // console.log("Updating Mentions");

    const markType = getMarkType(ClickableMark.name, editor.schema);
    appState.viewedDocument.setText(editor.getText());
    editor.state.doc.descendants((node, pos) => {
      node.marks.forEach((mark) => {
        if (mark.type !== markType || node.text === undefined) {
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

  useEffect(() => {
    if (blockNextMentionRerender.current) {
      blockNextMentionRerender.current = false;
      return;
    }
    blockNextMentionUpdate.current = true;
    // console.log("Setting content");

    editor.commands.setContent(`<text>${document.text}</text>`);
    queueMicrotask(() => {
      editor.chain().focus();

      const { state, view } = editor;
      const tr = state.tr;

      const markType = getMarkType(ClickableMark.name, editor.schema);

      for (const mention of document.mentionList) {
        if (mention.end_index - 1 > document.text.length) {
          console.warn(
            "Invalid mention indices",
            mention.end_index,
            document.text.length,
          );
          continue;
        }
        try {
          tr.addMark(
            mention.start_index + 1,
            mention.end_index + 1,
            markType.create({ mention: mention }),
          );
        } catch (e) {
          console.error(e);
        }
      }

      // document.mentionList.forEach((m) => {
      //   tr.addMark(
      //     m.start_index + 1,
      //     m.end_index + 1,
      //     markType.create({ mention: m }),
      //   );
      // });
      // console.log("Calling dispatch");

      blockNextMentionUpdate.current = true;
      view.dispatch(tr);
    });
  }, [document, editor, document.text, document.mentionList]);

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
      // style={{
      //   width: appState.viewedDocument !== null ? 300 : 0,
      //   padding: appState.viewedDocument !== null ? 20 : 0,
      // }}
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
