import { observer } from "mobx-react";
import { useAppState } from "@/stores/appState.ts";
import {
  ActionIcon,
  Badge,
  Breadcrumbs,
  Button,
  Combobox,
  Divider,
  Group,
  Input,
  MultiSelect,
  Stack,
  useCombobox,
} from "@mantine/core";
import {
  IconFilter,
  IconFilterOff,
  IconPlus,
  IconSelector,
  IconX,
} from "@tabler/icons-react";
import "react-querybuilder/dist/query-builder.css";
import sharedClasses from "@/shared.module.css";
import { FilterManager, type FilterSequence } from "@/stores/filters.ts";
import FilterInterface from "./FilterInterface.tsx";
import { type GraphNodeType, RecordTypes } from "@/utils/schemas.ts";
import classes from "./FilterWidget.module.css";
import { DEFINES } from "@/defines.ts";

const FilterEditor = observer(
  ({ filterSequence }: { filterSequence: FilterSequence }) => {
    return (
      <Stack>
        <MultiSelect
          label={"Query by Node"}
          searchable
          clearable
          limit={300}
          scrollAreaProps={{ type: "auto" }}
          placeholder={
            filterSequence.includedIds.length == 0
              ? `All ${filterSequence.filterBy} Nodes Shown`
              : undefined
          }
          value={filterSequence.includedIds}
          // eslint-disable-next-line @typescript-eslint/unbound-method
          onChange={filterSequence.setIncludedIds}
          data={filterSequence.dataList.map((entity) => {
            return { value: entity.id, label: entity.name };
          })}
        />
        <Input.Wrapper label="Query by Attributes">
          <FilterInterface filterSequence={filterSequence} />
        </Input.Wrapper>
      </Stack>
    );
  },
);

const filterTypes = RecordTypes.map((item) => (
  <Combobox.Option value={item} key={item}>
    {item}
  </Combobox.Option>
));

const FilterTypeSelection = ({
  onSelect,
}: {
  onSelect: (_value: GraphNodeType) => void;
}) => {
  const newFilterCombobox = useCombobox({});

  return (
    <Combobox
      store={newFilterCombobox}
      styles={{ dropdown: { width: "100px", minWidth: "100px" } }}
      position="left-start"
      onOptionSubmit={(value) => {
        onSelect(value as GraphNodeType);
        newFilterCombobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <ActionIcon
          variant="default"
          radius={"lg"}
          className={classes.toggleFilterTypeButton}
          onClick={(event) => {
            event.stopPropagation();
            newFilterCombobox.toggleDropdown();
          }}
        >
          <IconSelector size={"12px"} />
        </ActionIcon>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>{filterTypes}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};

const FilterSystemElement = observer(
  ({
    filterSequence,
    index,
  }: {
    filterSequence: FilterSequence;
    index: number;
  }) => {
    const appState = useAppState();

    return (
      <Badge
        variant={
          appState.dataset.filterManager.selectedFilterIndex === index
            ? "filled"
            : "default"
        }
        classNames={{ root: classes.filterBadge }}
        styles={{
          root: {
            border:
              index === appState.dataset.filterManager.selectedFilterIndex
                ? "1px solid white"
                : undefined,
          },
        }}
        onClick={() => {
          appState.dataset.filterManager.setSelectedFilterIndex(index);
        }}
        leftSection={
          <FilterTypeSelection
            onSelect={(nodeType) => {
              filterSequence.setFilterBy(nodeType);
            }}
          />
        }
        rightSection={
          <ActionIcon
            className={classes.removeSequenceButton}
            radius={"lg"}
            color={"var(--mantine-color-gray-8)"}
            onClick={(event) => {
              event.stopPropagation();
              appState.dataset.filterManager.removeFilterSequence(index);
            }}
          >
            <IconX size={"8px"}></IconX>
          </ActionIcon>
        }
      >
        {filterSequence.filterBy}
      </Badge>
    );
  },
);

const AddNewFilter = observer(
  ({ filterManager }: { filterManager: FilterManager }) => {
    const newFilterCombobox = useCombobox({});

    return (
      <Combobox
        store={newFilterCombobox}
        styles={{ dropdown: { width: "100px", minWidth: "100px" } }}
        position="right-start"
        onOptionSubmit={(value) => {
          filterManager.addFilterSequence(value as GraphNodeType);
          newFilterCombobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <ActionIcon
            radius={"lg"}
            style={{ "--ai-size": "20px" }}
            onClick={() => {
              newFilterCombobox.toggleDropdown();
            }}
          >
            <IconPlus stroke={2.5} size={12} />
          </ActionIcon>
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>{filterTypes}</Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    );
  },
);

const FilterWidget = observer(() => {
  const appState = useAppState();

  const filterSequence = appState.dataset.filterManager.selectedFilter;

  return (
    <Stack className={sharedClasses.widgetContainer}>
      <div className={sharedClasses.widgetTopbar}>
        <h3>Query Builder</h3>
      </div>

      <Input.Wrapper label="Query Sequence">
        <Breadcrumbs
          separator="→"
          separatorMargin="xs"
          mt={"sm"}
          style={{ rowGap: "8px" }}
        >
          {appState.dataset.filterManager.filterSequences.map(
            (filterSequence, index) => {
              return (
                <FilterSystemElement
                  key={filterSequence.id}
                  filterSequence={filterSequence}
                  index={index}
                />
              );
            },
          )}
          {appState.dataset.filterManager.filterSequences.length <
            DEFINES.maxFilterSequences && (
            <AddNewFilter filterManager={appState.dataset.filterManager} />
          )}
        </Breadcrumbs>
      </Input.Wrapper>
      <Group>
        <Button
          leftSection={<IconFilter size={14} />}
          style={{ width: "fit-content" }}
          onClick={() => {
            appState.dataset.applyFilterSequences(
              appState.dataset.filterManager.filterSequences,
            );
          }}
        >
          Apply Query
        </Button>
        <Button
          color="gray.8"
          leftSection={<IconFilterOff size={14} />}
          onClick={() => {
            appState.dataset.removeFilters();
          }}
        >
          Remove Query
        </Button>
      </Group>
      <Divider />
      {filterSequence && <FilterEditor filterSequence={filterSequence} />}
    </Stack>
  );
});

export default FilterWidget;
