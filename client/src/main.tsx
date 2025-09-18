import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { rootStore, RootStoreProvider } from "./stores/rootStore.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootStoreProvider value={rootStore}>
      <App />
    </RootStoreProvider>
  </StrictMode>,
);
