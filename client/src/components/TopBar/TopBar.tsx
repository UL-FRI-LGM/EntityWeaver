import { observer } from "mobx-react";
import classes from "./TopBar.module.css";
import { Button, Group, Menu, Switch } from "@mantine/core";
import { useAppState } from "@/stores/appState.ts";
import {
  IconAt,
  IconBorderSides,
  IconCaretDownFilled,
  IconCaretUpFilled,
  IconColorFilter,
  IconDotsCircleHorizontal,
  IconDownload,
  IconFile,
  IconFileCode2,
  IconHandFinger,
  IconMapPin,
  IconPointer,
  IconRefresh,
  IconSitemap,
  IconTextScan2,
  IconUpload,
  IconUserCircle,
} from "@tabler/icons-react";
import { useState } from "react";
import { useFileDialog } from "@mantine/hooks";
import { downloadTextFile } from "@/utils/helpers.ts";

const DisplayMenu = observer(() => {
  const appState = useAppState();

  const [showMenu, setShowMenu] = useState(false);

  return (
    <Menu opened={showMenu} shadow="md" width={250}>
      <Menu.Target>
        <Button
          className={classes.filterButton}
          classNames={{ label: classes.filterLabel }}
          variant="subtle"
          color="gray"
          rightSection={
            showMenu ? (
              <IconCaretUpFilled size={14} />
            ) : (
              <IconCaretDownFilled size={14} />
            )
          }
          onClick={() => {
            setShowMenu(!showMenu);
          }}
        >
          Display Options
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconColorFilter size={14} />}
          rightSection={<Switch checked={appState.uiState.colorByType} />}
          onClick={(event) => {
            event.preventDefault();
            appState.uiState.setColorByType(!appState.uiState.colorByType);
          }}
        >
          Color By Entity Type
        </Menu.Item>
        <Menu.Item
          leftSection={<IconPointer size={14} />}
          rightSection={<Switch checked={appState.uiState.highlightOnHover} />}
          onClick={(event) => {
            event.preventDefault();
            appState.setHighlightOnHover(!appState.uiState.highlightOnHover);
          }}
        >
          Highlight On Hover
        </Menu.Item>
        <Menu.Item
          leftSection={<IconHandFinger size={14} />}
          rightSection={<Switch checked={appState.uiState.highlightOnSelect} />}
          onClick={(event) => {
            event.preventDefault();
            appState.setHighlightOnSelect(!appState.uiState.highlightOnSelect);
          }}
        >
          Highlight On Selection
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});

const FiltersMenu = observer(() => {
  const appState = useAppState();

  const [showFilters, setShowFilters] = useState(false);

  return (
    <Menu opened={showFilters} shadow="md" width={200}>
      <Menu.Target>
        <Button
          className={classes.filterButton}
          classNames={{ label: classes.filterLabel }}
          variant="subtle"
          color="gray"
          rightSection={
            showFilters ? (
              <IconCaretUpFilled size={14} />
            ) : (
              <IconCaretDownFilled size={14} />
            )
          }
          onClick={() => {
            setShowFilters(!showFilters);
          }}
        >
          Filters
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Nodes</Menu.Label>
        <Menu.Item
          leftSection={<IconBorderSides size={14} />}
          rightSection={<Switch checked={appState.uiState.filters.entities} />}
          onClick={(event) => {
            event.preventDefault();
            appState.uiState.toggleFilter("entities");
          }}
        >
          Entities
        </Menu.Item>
        <Menu.Item
          leftSection={<IconAt size={14} />}
          rightSection={<Switch checked={appState.uiState.filters.mentions} />}
          onClick={(event) => {
            event.preventDefault();
            appState.uiState.toggleFilter("mentions");
          }}
        >
          Mentions
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFile size={14} />}
          rightSection={<Switch checked={appState.uiState.filters.documents} />}
          onClick={(event) => {
            event.preventDefault();
            appState.uiState.toggleFilter("documents");
          }}
        >
          Documents
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Entity Types</Menu.Label>
        <Menu.Item
          leftSection={<IconUserCircle size={14} />}
          rightSection={<Switch checked={appState.uiState.filters.people} />}
          onClick={(event) => {
            event.preventDefault();
            appState.uiState.toggleFilter("people");
          }}
        >
          People
        </Menu.Item>
        <Menu.Item
          leftSection={<IconMapPin size={14} />}
          rightSection={<Switch checked={appState.uiState.filters.locations} />}
          onClick={(event) => {
            event.preventDefault();
            appState.uiState.toggleFilter("locations");
          }}
        >
          Locations
        </Menu.Item>
        <Menu.Item
          leftSection={<IconSitemap size={14} />}
          rightSection={
            <Switch checked={appState.uiState.filters.organizations} />
          }
          onClick={(event) => {
            event.preventDefault();
            appState.uiState.toggleFilter("organizations");
          }}
        >
          Organizations
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDotsCircleHorizontal size={14} />}
          rightSection={
            <Switch checked={appState.uiState.filters.miscellaneous} />
          }
          onClick={(event) => {
            event.preventDefault();
            appState.uiState.toggleFilter("miscellaneous");
          }}
        >
          Miscellaneous
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Connections</Menu.Label>

        <Menu.Item
          leftSection={<IconTextScan2 size={14} />}
          rightSection={
            <Switch checked={appState.uiState.filters.collocations} />
          }
          onClick={(event) => {
            event.preventDefault();
            appState.uiState.toggleFilter("collocations");
          }}
        >
          Collocations
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});

const FileMenu = observer(() => {
  const appState = useAppState();

  const [showFileMenu, setShowFileMenu] = useState(false);

  const uploadJSONDialog = useFileDialog({
    accept: ".json",
    resetOnOpen: true,
    onChange: (files: FileList | null) => {
      onImportGraphFromJson(files).catch(console.error);
    },
  });

  async function onImportGraphFromJson(files: FileList | null) {
    if (!files || files.length === 0) return;
    const graphFile = files[0];
    await appState.dataset.loadFromFile(graphFile);
  }

  function onExportGraphToJson() {
    try {
      const dataset = appState.dataset.toJson();
      downloadTextFile(JSON.stringify(dataset, null, 2), "graph.json");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Menu
      opened={showFileMenu}
      onChange={(value) => {
        setShowFileMenu(value);
      }}
      position="bottom-start"
      shadow="md"
    >
      <Menu.Target>
        <Button
          className={classes.filterButton}
          classNames={{ label: classes.filterLabel }}
          variant="subtle"
          color="gray"
          rightSection={
            showFileMenu ? (
              <IconCaretUpFilled size={14} />
            ) : (
              <IconCaretDownFilled size={14} />
            )
          }
        >
          File
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconUpload size={14} />}
          onClick={uploadJSONDialog.open}
        >
          Load Graph from JSON
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDownload size={14} />}
          onClick={onExportGraphToJson}
        >
          Export Graph to JSON
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFileCode2 size={14} />}
          onClick={() => {
            appState.dataset.loadDemo().catch(console.error);
          }}
        >
          Load Demo data
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});

const TopBar = observer(() => {
  const appState = useAppState();

  return (
    <Group justify={"space-between"} className={classes.container}>
      <Group gap={40}>
        <FileMenu />

        <Switch
          label={"Entity View"}
          disabled={appState.graphLoading}
          checked={appState.uiState.entityView}
          classNames={{ label: classes.switchLabel }}
          onChange={(event) => {
            appState.setEntityView(event.currentTarget.checked);
          }}
        />

        <FiltersMenu />

        <Button
          variant={"default"}
          disabled={appState.graphLoading || appState.isLayoutInProgress}
          onClick={() => {
            appState.runLayout();
          }}
          leftSection={
            <IconRefresh
              className={
                !appState.graphLoading && appState.isLayoutInProgress
                  ? classes.iconSpin
                  : undefined
              }
              size={14}
            />
          }
        >
          Reset Layout
        </Button>
      </Group>
      <DisplayMenu />
    </Group>
  );
});

export default TopBar;
