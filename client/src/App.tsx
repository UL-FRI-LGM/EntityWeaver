import classes from "./App.module.css";
import EditorWidget from "./components/EditorWidget/EditorWidget.tsx";
import TopBar from "./components/TopBar/TopBar.tsx";
import { useWindowEvent } from "@mantine/hooks";
import { observer } from "mobx-react";
import { useAppState } from "./stores/appState.ts";
import DocumentTextView from "@/components/DocumentTextView/DocumentTextView.tsx";
import { Grid, GridCol } from "@mantine/core";
import TableGraphWindow from "@/components/TableGraphWindow/TableGraphWindow.tsx";
import FilterWidget from "@/components/FilterWidget/FilterWidget.tsx";

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
          <Grid.Col span={8} className={classes.gridContainer}>
            <TableGraphWindow />
          </Grid.Col>
          <GridCol span={4}>
            <FilterWidget />
          </GridCol>
        </Grid>
        <Grid className={classes.lowerGrid}>
          <Grid.Col span={8}>
            <DocumentTextView />
          </Grid.Col>
          <Grid.Col span={4}>
            <EditorWidget />
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
});

export default App;
