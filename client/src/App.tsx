import classes from "./App.module.css";
import EntityGraph from "./components/EntityGraph/EntityGraph.tsx";
import RightWidget from "./components/RightWidget/RightWidget.tsx";
import TopBar from "./components/TopBar/TopBar.tsx";
import { useWindowEvent } from "@mantine/hooks";
import { observer } from "mobx-react";
import { useMst } from "./stores/rootStore.ts";
import { Group, Text } from "@mantine/core";
import RightClickIcon from "./assets/mouse-right-button.svg?react";
import LeftClickIcon from "./assets/mouse-left-button.svg?react";
import { type MouseEvent } from "react";

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

  function onContextMenu(event: MouseEvent) {
    event.preventDefault();
    rootStore.setSelectedNode(null);
  }

  return (
    <div className={classes.app}>
      <TopBar />
      <div className={classes.main}>
        <div onContextMenu={onContextMenu} className={classes.graphContainer}>
          <EntityGraph />
          <Group className={classes.graphTooltipContainer}>
            <Group className={classes.mouseClickTooltip}>
              <LeftClickIcon fill="white" width={25} height={25} />
              <Text>Select Node</Text>
            </Group>
            {/*<Group className={classes.mouseClickTooltip}>*/}
            {/*  <LeftClickIcon fill="white" width={25} height={25} />*/}
            {/*  <Text>Zoom to Node</Text>*/}
            {/*  <Text className={classes.doubleClockTooltip}>2x</Text>*/}
            {/*</Group>*/}
            <Group className={classes.mouseClickTooltip}>
              <RightClickIcon fill="white" width={25} height={25} />
              <Text>Reset Selection</Text>
            </Group>
          </Group>
        </div>
        <RightWidget />
      </div>
    </div>
  );
});

export default App;
