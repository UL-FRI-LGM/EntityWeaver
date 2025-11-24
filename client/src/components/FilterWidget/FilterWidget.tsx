import { observer } from "mobx-react";
import { useAppState } from "@/stores/appState.ts";
import {
  ActionIcon,
  Button,
  Combobox,
  Flex,
  Group,
  InputBase,
  Stack,
  TextInput,
  useCombobox,
} from "@mantine/core";
import SearchableCombobox from "@/components/SearchableCombobox/SearchableCombobox.tsx";
import {
  type FilterInstance,
  FilterSequence,
  Operator,
  type OperatorType,
} from "@/stores/filters.ts";
import classes from "./FilterWidget.module.css";
import {
  IconFilter,
  IconFilterOff,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import clsx from "clsx";

const operatorOptions = Object.values(Operator).map((item) => (
  <Combobox.Option value={item} key={item}>
    {item}
  </Combobox.Option>
));

const FilterEditor = observer(
  ({
    filterInstance,
    hasOperator,
    canDelete,
  }: {
    filterInstance: FilterInstance;
    hasOperator: boolean;
    canDelete: boolean;
  }) => {
    const operatorCombobox = useCombobox({
      onDropdownClose: () => {
        operatorCombobox.resetSelectedOption();
      },
    });

    const filterSequence = filterInstance.filterSequence;

    return (
      <Group className={classes.filterFlexContainer} justify={"space-between"}>
        <SearchableCombobox
          options={filterSequence.potentialAttributes.map((attribute) => ({
            val: attribute.name,
            display: attribute.name,
          }))}
          selectedValue={
            filterInstance.attribute ? filterInstance.attribute.name : ""
          }
          onChange={(id) => {
            const attribute = filterSequence.getAttributeByName(id);
            if (attribute) {
              filterInstance.setAttribute(attribute);
            }
          }}
          textInputProps={{
            className: classes.typeSelection,
          }}
        />
        <TextInput
          value={filterInstance.filterValue}
          onChange={(event) => {
            filterInstance.filterValue = event.currentTarget.value;
          }}
          className={classes.valueInput}
        />
        {hasOperator ? (
          <Group
            className={clsx(classes.filterFlexContainer, classes.rightColumn)}
          >
            <Combobox
              store={operatorCombobox}
              onOptionSubmit={(val) => {
                if (!Object.values(Operator).includes(val as OperatorType)) {
                  return;
                }
                filterInstance.setOperator(val as OperatorType);
                operatorCombobox.closeDropdown();
              }}
            >
              <Combobox.Target>
                <InputBase
                  component="button"
                  type="button"
                  pointer
                  rightSection={<Combobox.Chevron />}
                  rightSectionPointerEvents="none"
                  onClick={() => {
                    operatorCombobox.toggleDropdown();
                  }}
                >
                  {filterInstance.operator}
                </InputBase>
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>{operatorOptions}</Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
            <ActionIcon
              disabled={!canDelete}
              variant="default"
              className={classes.removeFilter}
              onClick={() => {
                filterInstance.filterSequence.removeFilter(filterInstance);
              }}
            >
              <IconTrash size={20} />
            </ActionIcon>
          </Group>
        ) : (
          <Flex align={"center"} className={classes.rightColumn}>
            <ActionIcon
              style={{ marginLeft: "10px" }}
              radius="xl"
              variant="default"
              onClick={() => {
                filterInstance.filterSequence.addFilter();
              }}
            >
              <IconPlus stroke={1.5} />
            </ActionIcon>
          </Flex>
        )}
      </Group>
    );
  },
);

const FilterSequenceEditor = observer(
  ({ filterSequence }: { filterSequence: FilterSequence }) => {
    return (
      <Stack className={classes.filterFlexContainer}>
        {filterSequence.filters.map((filter, index) => {
          return (
            <FilterEditor
              key={filter.id}
              filterInstance={filter}
              hasOperator={index < filterSequence.filters.length - 1}
              canDelete={index != 0}
            />
          );
        })}
      </Stack>
    );
  },
);

const FilterWidget = observer(() => {
  const appState = useAppState();

  return (
    <Stack w={"100%"} p={5}>
      <h1>Filter</h1>
      <FilterSequenceEditor
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
