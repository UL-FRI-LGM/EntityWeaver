import { observer } from "mobx-react";
import classes from "./TableGraphWindow.module.css";
import { useAppState } from "@/stores/appState.ts";
import TableWidget from "@/components/TableWidget/TableWidget.tsx";
import EntityGraphWidget from "@/components/EntityGraph/EntityGraph.tsx";
import { SegmentedControl } from "@mantine/core";

const TableGraphWindow = observer(() => {
  const appState = useAppState();

  return (
    <div className={classes.main}>
      <div className={classes.topbar}>
        <SegmentedControl
          value={appState.uiState.tableView ? "table" : "graph"}
          onChange={(value) => {
            appState.uiState.setTableView(value === "table");
          }}
          data={[
            { label: "Table View", value: "table" },
            { label: "Graph View", value: "graph" },
          ]}
        />
      </div>
      <div className={classes.container}>
        <div
          className={classes.inner}
          style={{
            visibility: appState.uiState.tableView ? "visible" : "hidden",
          }}
        >
          <TableWidget />
        </div>
        <div
          className={classes.inner}
          style={{
            visibility: appState.uiState.tableView ? "hidden" : "visible",
          }}
        >
          <EntityGraphWidget />
        </div>
      </div>
    </div>
  );
});

export default TableGraphWindow;
