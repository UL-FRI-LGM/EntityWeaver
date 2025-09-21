import "./App.css";
import EntityGraph from "./components/EntityGraph/EntityGraph.tsx";
import RightWidget from "./components/RightWidget/RightWidget.tsx";
import TopBar from "./components/TopBar/TopBar.tsx";
import { useWindowEvent } from "@mantine/hooks";
import { observer } from "mobx-react";
import { useMst } from "./stores/rootStore.ts";

const App = observer(() => {
  const rootStore = useMst();

  useWindowEvent("keydown", (event) => {
    if (event.key === "Shift") {
      rootStore.setHoldingShift(true);
    }
  });

  useWindowEvent("keyup", (event) => {
    if (event.key === "Shift") {
      rootStore.setHoldingShift(false);
    }
  });

  return (
    <div className="app">
      <TopBar />
      <div className="main">
        <EntityGraph />
        <RightWidget />
      </div>
    </div>
  );
});

export default App;
