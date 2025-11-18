import { observer } from "mobx-react";
import classes from "./TableGraphWindow.module.css";
import { useAppState } from "@/stores/appState.ts";
import TableWidget from "@/components/TableWidget/TableWidget.tsx";
import EntityGraphWidget from "@/components/EntityGraph/EntityGraph.tsx";
import { Button, Menu, SegmentedControl } from "@mantine/core";
import UncertaintyTFWidget from "@/components/TableGraphWindow/UncertaintyTFWidget.tsx";
import { useState } from "react";

const TableGraphWindow = observer(() => {
  const appState = useAppState();
  const [tfMenuOpen, setTfMenuOpen] = useState(false);

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
        <Menu opened={tfMenuOpen} onChange={setTfMenuOpen}>
          <Menu.Target>
            <Button>Transfer Functions</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item>
              <UncertaintyTFWidget />
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
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
