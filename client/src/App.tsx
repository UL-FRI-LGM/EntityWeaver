import classes from "./App.module.css";
import RightWidget from "./components/RightWidget/RightWidget.tsx";
import TopBar from "./components/TopBar/TopBar.tsx";
import { useWindowEvent } from "@mantine/hooks";
import { observer } from "mobx-react";
import { useAppState } from "./stores/appState.ts";
import DocumentTextView from "@/components/DocumentTextView/DocumentTextView.tsx";
import EntityGraphWidget from "./components/EntityGraph/EntityGraph.tsx";

const App = observer(() => {
  const appState = useAppState();

  useWindowEvent("keydown", (event) => {
    if (event.key === "Shift") {
      appState.setHoldingShift(true);
    }
  });

  useWindowEvent("keyup", (event) => {
    if (event.key === "Shift") {
      appState.setHoldingShift(false);
    }
  });

  return (
    <div className={classes.app}>
      <TopBar />
      <div className={classes.main}>
        <EntityGraphWidget />
        <RightWidget />
        <DocumentTextView />
      </div>
    </div>
  );
});

export default App;
