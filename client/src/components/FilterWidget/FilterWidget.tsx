import { observer } from "mobx-react";
import { useAppState } from "@/stores/appState.ts";
import { Button, Group, Input, MultiSelect, Stack } from "@mantine/core";
import { IconFilter, IconFilterOff } from "@tabler/icons-react";
import "react-querybuilder/dist/query-builder.css";
import FilterEditor from "@/components/FilterWidget/FilterInterface.tsx";
import sharedClasses from "@/shared.module.css";

const FilterWidget = observer(() => {
  const appState = useAppState();

  const filterSequence = appState.dataset.filterManager.filterSequence;

  return (
    <Stack className={sharedClasses.widgetContainer}>
      <div className={sharedClasses.widgetTopbar}>
        <h3>Filters</h3>
      </div>
      <MultiSelect
        label={"Filter by Node"}
        searchable
        clearable
        limit={300}
        scrollAreaProps={{ type: "auto" }}
        placeholder={
          filterSequence.includedIds.length == 0
            ? "All Mention Nodes Shown"
            : undefined
        }
        value={filterSequence.includedIds}
        // eslint-disable-next-line @typescript-eslint/unbound-method
        onChange={filterSequence.setIncludedIds}
        data={appState.dataset.mentionList.map((mention) => {
          return { value: mention.id, label: mention.name };
        })}
      />
      <Input.Wrapper label="Filter by Attributes">
        <FilterEditor filterSequence={filterSequence} />
      </Input.Wrapper>
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
          color="gray.8"
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
