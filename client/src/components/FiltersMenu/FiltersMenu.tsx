import { observer } from "mobx-react";
import { useAppState } from "@/stores/appState.ts";
import { useState } from "react";
import { Menu, Switch } from "@mantine/core";
import ArrowDropdownButton from "@/components/Shared/ArrowDropdownButton.tsx";
import { IconAt, IconBorderSides, IconFile } from "@tabler/icons-react";

const FiltersMenu = observer(() => {
  const appState = useAppState();

  const [showFilters, setShowFilters] = useState(false);

  return (
    <Menu opened={showFilters} shadow="md" width={200}>
      <Menu.Target>
        <ArrowDropdownButton
          shownMenu={showFilters}
          onClick={() => {
            setShowFilters(!showFilters);
          }}
        >
          Filters
        </ArrowDropdownButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Node Types</Menu.Label>
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

        {/*<Menu.Label>Entity Types</Menu.Label>*/}
        {/*<Menu.Item*/}
        {/*  leftSection={<IconUserCircle size={14} />}*/}
        {/*  rightSection={<Switch checked={appState.uiState.filters.people} />}*/}
        {/*  onClick={(event) => {*/}
        {/*    event.preventDefault();*/}
        {/*    appState.uiState.toggleFilter("people");*/}
        {/*  }}*/}
        {/*>*/}
        {/*  People*/}
        {/*</Menu.Item>*/}
        {/*<Menu.Item*/}
        {/*  leftSection={<IconMapPin size={14} />}*/}
        {/*  rightSection={<Switch checked={appState.uiState.filters.locations} />}*/}
        {/*  onClick={(event) => {*/}
        {/*    event.preventDefault();*/}
        {/*    appState.uiState.toggleFilter("locations");*/}
        {/*  }}*/}
        {/*>*/}
        {/*  Locations*/}
        {/*</Menu.Item>*/}
        {/*<Menu.Item*/}
        {/*  leftSection={<IconSitemap size={14} />}*/}
        {/*  rightSection={*/}
        {/*    <Switch checked={appState.uiState.filters.organizations} />*/}
        {/*  }*/}
        {/*  onClick={(event) => {*/}
        {/*    event.preventDefault();*/}
        {/*    appState.uiState.toggleFilter("organizations");*/}
        {/*  }}*/}
        {/*>*/}
        {/*  Organizations*/}
        {/*</Menu.Item>*/}
        {/*<Menu.Item*/}
        {/*  leftSection={<IconDotsCircleHorizontal size={14} />}*/}
        {/*  rightSection={*/}
        {/*    <Switch checked={appState.uiState.filters.miscellaneous} />*/}
        {/*  }*/}
        {/*  onClick={(event) => {*/}
        {/*    event.preventDefault();*/}
        {/*    appState.uiState.toggleFilter("miscellaneous");*/}
        {/*  }}*/}
        {/*>*/}
        {/*  Miscellaneous*/}
        {/*</Menu.Item>*/}

        {/*<Menu.Divider />*/}

        {/*<Menu.Label>Connections</Menu.Label>*/}

        {/*<Menu.Item*/}
        {/*  leftSection={<IconTextScan2 size={14} />}*/}
        {/*  rightSection={*/}
        {/*    <Switch checked={appState.uiState.filters.collocations} />*/}
        {/*  }*/}
        {/*  onClick={(event) => {*/}
        {/*    event.preventDefault();*/}
        {/*    appState.uiState.toggleFilter("collocations");*/}
        {/*  }}*/}
        {/*>*/}
        {/*  Collocations*/}
        {/*</Menu.Item>*/}
      </Menu.Dropdown>
    </Menu>
  );
});

export default FiltersMenu;
