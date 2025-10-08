import { observer } from "mobx-react";
import classes from "./TopBar.module.css";
import { Button, Group, Menu, Switch } from "@mantine/core";
import { useAppState } from "@/stores/rootStore.ts";
import {
  IconAt,
  IconBorderSides,
  IconCaretDownFilled,
  IconCaretUpFilled,
  IconDotsCircleHorizontal,
  IconDownload,
  IconFile,
  IconFileCode2,
  IconMapPin,
  IconRefresh,
  IconSitemap,
  IconTextScan2,
  IconUpload,
  IconUserCircle,
} from "@tabler/icons-react";
import { useState } from "react";
import { useFileDialog } from "@mantine/hooks";
import { downloadTextFile } from "@/utils/helpers.ts";

const FiltersMenu = observer(() => {
  const rootStore = useAppState();

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
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Nodes</Menu.Label>
        <Menu.Item
          leftSection={<IconBorderSides size={14} />}
          rightSection={<Switch checked={rootStore.uiState.filters.entities} />}
          onClick={(event) => {
            event.preventDefault();
            rootStore.uiState.filters.entities =
              !rootStore.uiState.filters.entities;
          }}
        >
          Entities
        </Menu.Item>
        <Menu.Item
          leftSection={<IconAt size={14} />}
          rightSection={<Switch checked={rootStore.uiState.filters.mentions} />}
          onClick={(event) => {
            event.preventDefault();
            rootStore.uiState.filters.mentions =
              !rootStore.uiState.filters.mentions;
          }}
        >
          Mentions
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFile size={14} />}
          rightSection={
            <Switch checked={rootStore.uiState.filters.documents} />
          }
          onClick={(event) => {
            event.preventDefault();
            rootStore.uiState.filters.documents =
              !rootStore.uiState.filters.documents;
          }}
        >
          Documents
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Entity Types</Menu.Label>
        <Menu.Item
          leftSection={<IconUserCircle size={14} />}
          rightSection={<Switch checked={rootStore.uiState.filters.people} />}
          onClick={(event) => {
            event.preventDefault();
            rootStore.uiState.filters.people =
              !rootStore.uiState.filters.people;
          }}
        >
          People
        </Menu.Item>
        <Menu.Item
          leftSection={<IconMapPin size={14} />}
          rightSection={
            <Switch checked={rootStore.uiState.filters.locations} />
          }
          onClick={(event) => {
            event.preventDefault();
            rootStore.uiState.filters.locations =
              !rootStore.uiState.filters.locations;
          }}
        >
          Locations
        </Menu.Item>
        <Menu.Item
          leftSection={<IconSitemap size={14} />}
          rightSection={
            <Switch checked={rootStore.uiState.filters.organizations} />
          }
          onClick={(event) => {
            event.preventDefault();
            rootStore.uiState.filters.organizations =
              !rootStore.uiState.filters.organizations;
          }}
        >
          Organizations
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDotsCircleHorizontal size={14} />}
          rightSection={
            <Switch checked={rootStore.uiState.filters.miscellaneous} />
          }
          onClick={(event) => {
            event.preventDefault();
            rootStore.uiState.filters.miscellaneous =
              !rootStore.uiState.filters.miscellaneous;
          }}
        >
          Miscellaneous
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Connections</Menu.Label>

        <Menu.Item
          leftSection={<IconTextScan2 size={14} />}
          rightSection={
            <Switch checked={rootStore.uiState.filters.collocations} />
          }
          onClick={(event) => {
            event.preventDefault();
            rootStore.uiState.filters.collocations =
              !rootStore.uiState.filters.collocations;
          }}
        >
          Collocations
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});

const FileMenu = observer(() => {
  const rootStore = useAppState();

  const [showFileMenu, setShowFileMenu] = useState(false);

  const uploadJSONDialog = useFileDialog({
    accept: ".json",
    resetOnOpen: true,
    onChange: onImportGraphFromJson,
  });

  async function onImportGraphFromJson(files: FileList | null) {
    try {
      if (!files || files.length === 0) return;
      const graphFile = files[0];
      await rootStore.dataset.loadFromFile(graphFile);
      // const dataset = JSON.parse(contents);
      // rootStore.dataset.loadDataset(dataset);
    } catch (error) {
      console.error(error);
    }
  }

  function onExportGraphToJson() {
    try {
      const dataset = rootStore.dataset.toJson();
      downloadTextFile(JSON.stringify(dataset, null, 2), "graph.json");
    } catch (error) {
      console.error(error);
    }
  }

  async function loadDemo() {
    try {
      await rootStore.dataset.loadDemo();
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <Menu
      opened={showFileMenu}
      onChange={(value) => setShowFileMenu(value)}
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
        <Menu.Item leftSection={<IconFileCode2 size={14} />} onClick={loadDemo}>
          Load Demo data
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
});

const TopBar = observer(() => {
  const rootStore = useAppState();

  return (
    <Group justify={"space-between"} className={classes.container}>
      <Group gap={40}>
        <FileMenu />

        <Switch
          label={"Entity View"}
          disabled={rootStore.graphLoading}
          checked={rootStore.uiState.entityView}
          classNames={{ label: classes.switchLabel }}
          onChange={(event) =>
            rootStore.setEntityView(event.currentTarget.checked)
          }
        />

        <FiltersMenu />

        <Button
          variant={"default"}
          disabled={rootStore.graphLoading || rootStore.isLayoutInProgress}
          onClick={() => rootStore.runLayout()}
          leftSection={
            <IconRefresh
              className={
                !rootStore.graphLoading && rootStore.isLayoutInProgress
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

      <Group gap={40}>
        <Switch
          label={"Color By Entity Type"}
          disabled={rootStore.graphLoading}
          checked={rootStore.uiState.colorByType}
          classNames={{ label: classes.switchLabel }}
          onChange={(event) =>
            (rootStore.uiState.colorByType = event.currentTarget.checked)
          }
        />
        <Switch
          label={"Highlight On Hover"}
          disabled={rootStore.graphLoading}
          checked={rootStore.uiState.highlightOnHover}
          classNames={{ label: classes.switchLabel }}
          onChange={(event) =>
            rootStore.setHighlightOnHover(event.currentTarget.checked)
          }
        />
        <Switch
          label={"Highlight On Selection"}
          disabled={rootStore.graphLoading}
          checked={rootStore.uiState.highlightOnSelect}
          classNames={{ label: classes.switchLabel }}
          onChange={(event) =>
            rootStore.setHighlightOnSelect(event.currentTarget.checked)
          }
        />
      </Group>
    </Group>
  );
});

export default TopBar;
