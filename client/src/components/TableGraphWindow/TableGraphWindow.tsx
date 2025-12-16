import { observer } from "mobx-react";
import classes from "./TableGraphWindow.module.css";
import sharedClasses from "@/shared.module.css";
import { useAppState } from "@/stores/appState.ts";
import TableWidget from "@/components/TableWidget/TableWidget.tsx";
import EntityGraphWidget from "@/components/EntityGraph/EntityGraph.tsx";
import { Group, Popover, SegmentedControl } from "@mantine/core";
import UncertaintyTFWidget from "@/components/TableGraphWindow/UncertaintyTFWidget.tsx";
import { useState } from "react";
import ArrowDropdownButton from "@/components/Shared/ArrowDropdownButton.tsx";
import EntityTypeProperties from "@/components/EntityTypeProperties/EntityTypeProperties.tsx";

type MenuTag = "mentions" | "entities" | "documents" | "edges";

const NodeTypeProperties = observer(() => {
  const appState = useAppState();

  const [menuOpen, setMenuOpen] = useState<MenuTag | null>(null);

  function toggleMenu(menuTag: MenuTag) {
    setMenuOpen(menuOpen !== menuTag ? menuTag : null);
  }

  return (
    <Group>
      <Popover
        opened={menuOpen === "mentions"}
        position="bottom-start"
        keepMounted={true}
      >
        <Popover.Target>
          <ArrowDropdownButton
            shownMenu={menuOpen === "mentions"}
            direction={"down"}
            onClick={() => {
              toggleMenu("mentions");
            }}
            style={{ height: 30 }}
          >
            Mentions
          </ArrowDropdownButton>
        </Popover.Target>
        <Popover.Dropdown
          className={classes.menuPopover}
          style={{
            border: "1px solid var(--mantine-color-gray-5)",
            boxShadow: "0 0 3px 3px black",
            backgroundColor: "var(--mantine-color-dark-outline)",
          }}
        >
          <EntityTypeProperties
            properties={appState.dataset.attributeManager.mentionProperties}
          />
        </Popover.Dropdown>
      </Popover>
      <Popover
        opened={menuOpen === "entities"}
        position="bottom-start"
        keepMounted={true}
      >
        <Popover.Target>
          <ArrowDropdownButton
            shownMenu={menuOpen === "entities"}
            direction={"down"}
            onClick={() => {
              toggleMenu("entities");
            }}
            style={{ height: 30 }}
          >
            Entities
          </ArrowDropdownButton>
        </Popover.Target>
        <Popover.Dropdown
          className={classes.menuPopover}
          style={{
            border: "1px solid var(--mantine-color-gray-5)",
            boxShadow: "0 0 3px 3px black",
            backgroundColor: "var(--mantine-color-dark-outline)",
          }}
        >
          <EntityTypeProperties
            properties={appState.dataset.attributeManager.entityProperties}
          />
        </Popover.Dropdown>
      </Popover>
      <Popover
        opened={menuOpen === "documents"}
        position="bottom-start"
        keepMounted={true}
      >
        <Popover.Target>
          <ArrowDropdownButton
            shownMenu={menuOpen === "documents"}
            direction={"down"}
            onClick={() => {
              toggleMenu("documents");
            }}
            style={{ height: 30 }}
          >
            Documents
          </ArrowDropdownButton>
        </Popover.Target>
        <Popover.Dropdown
          className={classes.menuPopover}
          style={{
            border: "1px solid var(--mantine-color-gray-5)",
            boxShadow: "0 0 3px 3px black",
            backgroundColor: "var(--mantine-color-dark-outline)",
          }}
        >
          <EntityTypeProperties
            properties={appState.dataset.attributeManager.documentProperties}
          />
        </Popover.Dropdown>
      </Popover>
      <Popover
        opened={menuOpen === "edges"}
        position="right-start"
        keepMounted={true}
      >
        <Popover.Target>
          <ArrowDropdownButton
            shownMenu={menuOpen === "edges"}
            direction={"right"}
            onClick={() => {
              toggleMenu("edges");
            }}
            style={{ height: 30 }}
          >
            Edge Coloring
          </ArrowDropdownButton>
        </Popover.Target>
        <Popover.Dropdown
          className={classes.menuPopover}
          style={{
            border: "1px solid var(--mantine-color-gray-5)",
            boxShadow: "0 0 3px 3px black",
            backgroundColor: "var(--mantine-color-dark-outline)",
          }}
        >
          <UncertaintyTFWidget />
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
});

const TableGraphWindow = observer(() => {
  const appState = useAppState();

  return (
    <div className={sharedClasses.widgetContainer}>
      <div className={sharedClasses.widgetTopbar}>
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
        <NodeTypeProperties />
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
