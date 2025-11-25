import { observer } from "mobx-react";
import { useAppState } from "@/stores/appState.ts";
import { Button, Group, Stack } from "@mantine/core";
import { IconFilter, IconFilterOff } from "@tabler/icons-react";
import "react-querybuilder/dist/query-builder.css";
import FilterEditor from "@/components/FilterWidget/FilterInterface.tsx";

const FilterWidget = observer(() => {
  const appState = useAppState();

  return (
    <Stack w={"100%"} p={5}>
      <h1>Filter</h1>
      <FilterEditor
        filterSequence={appState.dataset.filterManager.filterSequence}
      />
      <Group>
        <Button
          leftSection={<IconFilter size={14} />}
          style={{ width: "fit-content" }}
          onClick={() => {
            appState.dataset.applyFilterSequence(
              appState.dataset.filterManager.filterSequence,
            );
          }}
        >
          Apply Filter
        </Button>
        <Button
          color="gray"
          leftSection={<IconFilterOff size={14} />}
          onClick={() => {
            appState.dataset.removeFilters();
          }}
        >
          Remove Filter
        </Button>
      </Group>
    </Stack>
  );
});

export default FilterWidget;
