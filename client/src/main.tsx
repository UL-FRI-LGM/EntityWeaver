import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { rootStore, RootStoreProvider } from "./stores/rootStore.ts";
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
    <RootStoreProvider value={rootStore}>
      <MantineProvider defaultColorScheme="dark" theme={theme}>
        <App />
      </MantineProvider>
    </RootStoreProvider>
  </StrictMode>,
);
