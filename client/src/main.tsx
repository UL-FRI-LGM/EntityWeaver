import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import App from "./App.tsx";
import { appState, AppStateProvider } from "./stores/appState.ts";
import "@mantine/core/styles.css";
import "@mantine/tiptap/styles.css";
import "prosemirror-view/style/prosemirror.css";
import { createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({
  cursorType: "pointer",
  colors: {
    // primary: virtualColor({
    //   name: "primary",
    //   dark: "green",
    //   light: "green",
    // }),
  },
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStateProvider value={appState}>
      <MantineProvider defaultColorScheme="dark" theme={theme}>
        <App />
      </MantineProvider>
    </AppStateProvider>
  </StrictMode>,
);
