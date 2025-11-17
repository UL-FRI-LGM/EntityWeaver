import classes from "./App.module.css";
import RightWidget from "./components/RightWidget/RightWidget.tsx";
import TopBar from "./components/TopBar/TopBar.tsx";
import { useWindowEvent } from "@mantine/hooks";
import { observer } from "mobx-react";
import { useAppState } from "./stores/appState.ts";
import DocumentTextView from "@/components/DocumentTextView/DocumentTextView.tsx";
import EntityGraphWidget from "./components/EntityGraph/EntityGraph.tsx";
import { Grid, GridCol } from "@mantine/core";
import TableWidget from "@/components/TableWidget/TableWidget.tsx";
import FlowWidget from "@/components/FlowWidget/FlowWidget.tsx";

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
        <Grid className={classes.upperGrid}>
          <Grid.Col span={8}>
            <Grid className={classes.gridContainer}>
              <Grid.Col span={6}>
                <TableWidget />
              </Grid.Col>
              <Grid.Col span={6}>
                <EntityGraphWidget />
              </Grid.Col>
            </Grid>
          </Grid.Col>
          <GridCol span={4}>
            <FlowWidget />
          </GridCol>
        </Grid>
        <Grid className={classes.lowerGrid}>
          <Grid.Col span={8}>
            <DocumentTextView />
          </Grid.Col>
          <Grid.Col span={4}>
            <RightWidget />
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
});

export default App;
