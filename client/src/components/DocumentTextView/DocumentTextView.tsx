import { observer } from "mobx-react";
import classes from "./DocumentTextView.module.css";
import { Box, Title, Text, Mark } from "@mantine/core";
import { useAppState } from "@/stores/appState.ts";
import { Document } from "@/stores/document.ts";
import { useState } from "react";
import { typeToColor } from "@/utils/helpers.ts";
import globalClasses from "@/styles/global.module.css";

const TextViewContents = observer(({ document }: { document: Document }) => {
  return (
    <>
      <Title order={2} textWrap="balance">
        {document.title}
      </Title>
      <Text className={classes.content}>
        {document.textWithEntities.map(({ text, mention }, index) => {
          return mention ? (
            <Mark
              key={index}
              className={globalClasses.mark}
              color={
                typeToColor(mention.type) ??
                "var(--mantine-primary-color-filled)"
              }
            >
              {text}
            </Mark>
          ) : (
            <Text component="span" key={index}>
              {text}
            </Text>
          );
        })}
      </Text>
    </>
  );
});

const DocumentTextView = observer(() => {
  const appState = useAppState();
  const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);

  const selectedDocument = appState.selectedNodeInstance instanceof Document;

  return (
    <Box
      className={classes.textView}
      style={{
        width: selectedDocument ? 300 : 0,
        padding: selectedDocument ? 20 : 0,
      }}
      onTransitionStart={() => setIsTransitionActive(true)}
      onTransitionEnd={() => setIsTransitionActive(false)}
    >
      {!isTransitionActive && selectedDocument && (
        <TextViewContents document={appState.selectedNodeInstance} />
      )}
    </Box>
  );
});

export default DocumentTextView;
