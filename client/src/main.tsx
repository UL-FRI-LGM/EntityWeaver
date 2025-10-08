import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";
import App from "./App.tsx";
import { appState, AppStateProvider } from "./stores/rootStore.ts";
import "@mantine/core/styles.css";
import { createTheme, MantineProvider, virtualColor } from "@mantine/core";

const theme = createTheme({
  cursorType: "pointer",
  colors: {
    primary: virtualColor({
      name: "primary",
      dark: "green",
      light: "green",
    }),
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStateProvider value={appState}>
      <MantineProvider defaultColorScheme="dark" theme={theme}>
        <App />
      </MantineProvider>
    </AppStateProvider>
  </StrictMode>,
);
