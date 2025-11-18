import { observer } from "mobx-react";
import classes from "./TableGraphWindow.module.css";
import { useAppState } from "@/stores/appState.ts";
import TableWidget from "@/components/TableWidget/TableWidget.tsx";
import EntityGraphWidget from "@/components/EntityGraph/EntityGraph.tsx";
import { Popover, SegmentedControl } from "@mantine/core";
import UncertaintyTFWidget from "@/components/TableGraphWindow/UncertaintyTFWidget.tsx";
import { useState } from "react";
import ArrowDropdownButton from "@/components/Shared/ArrowDropdownButton.tsx";

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
        <Popover opened={tfMenuOpen} position="bottom-start">
          <Popover.Target>
            <ArrowDropdownButton
              shownMenu={tfMenuOpen}
              onClick={() => {
                setTfMenuOpen(!tfMenuOpen);
              }}
              style={{ height: 30 }}
            >
              Transfer Function
            </ArrowDropdownButton>
          </Popover.Target>
          <Popover.Dropdown>
            <UncertaintyTFWidget />
          </Popover.Dropdown>
        </Popover>
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
