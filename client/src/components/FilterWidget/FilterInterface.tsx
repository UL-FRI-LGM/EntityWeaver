import { observer } from "mobx-react";
import { QueryBuilderMantine } from "@react-querybuilder/mantine";
import {
  type ActionProps,
  defaultOperators,
  defaultValidator,
  type Field,
  isOptionGroupArray,
  type OptionList,
  QueryBuilder,
  uniqOptList,
  useValueSelector,
  type ValueSelectorProps,
} from "react-querybuilder";
import { FilterSequence } from "@/stores/filters.ts";
import { toJS } from "mobx";
import { ActionIcon, Button, MultiSelect, Select } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { DEFINES } from "@/defines.ts";
import { useMemo } from "react";

function getOperators(_fieldName: string, { fieldData }: { fieldData: Field }) {
  switch (fieldData.datatype) {
    case "enum":
      return [
        { name: "=", label: "is" },
        { name: "!=", label: "is not" },
      ];
    case "text":
      return [
        { name: "=", label: "is" },
        { name: "!=", label: "is not" },
        ...defaultOperators.filter((op) =>
          [
            "contains",
            "beginsWith",
            "endsWith",
            "doesNotContain",
            "doesNotBeginWith",
            "doesNotEndWith",
            "in",
            "notIn",
          ].includes(op.name),
        ),
      ];
    case "number":
      return [
        ...defaultOperators.filter((op) =>
          ["=", "!=", "<", ">", "<=", "=>"].includes(op.name),
        ),
      ];
  }
  return defaultOperators;
}

function getValueEditorType(
  _fieldName: string,
  _operatorName: string,
  { fieldData }: { fieldData: Field },
) {
  switch (fieldData.datatype) {
    case "boolean":
    case "enum":
      return "select";
  }
  return "text";
}

const RemoveButton = (actionProps: ActionProps) => {
  return (
    <ActionIcon
      variant="filled"
      color={"gray.8"}
      style={{ borderColor: "var(--mantine-color-dark-4)" }}
      className={actionProps.className}
      disabled={actionProps.disabled}
      data-testid={actionProps.testID}
      title={
        actionProps.disabledTranslation && actionProps.disabled
          ? actionProps.disabledTranslation.title
          : actionProps.title
      }
      onClick={(e) => {
        actionProps.handleOnClick(e);
      }}
      size={36}
    >
      <IconX size={20} />
    </ActionIcon>
  );
};

const AddButton = (actionProps: ActionProps) => {
  return (
    <Button
      variant="filled"
      color={"gray.8"}
      style={{ borderColor: "var(--mantine-color-dark-4)" }}
      className={actionProps.className}
      disabled={actionProps.disabled}
      data-testid={actionProps.testID}
      onClick={(e) => {
        actionProps.handleOnClick(e);
      }}
      title={
        actionProps.disabledTranslation && actionProps.disabled
          ? actionProps.disabledTranslation.title
          : actionProps.title
      }
      leftSection={<IconPlus size={12} />}
    >
      {actionProps.disabledTranslation && actionProps.disabled
        ? actionProps.disabledTranslation.label
        : actionProps.label}
    </Button>
  );
};

const optionListToComboboxData = (list: OptionList) => {
  const uniqList = uniqOptList(list);
  return isOptionGroupArray(uniqList)
    ? uniqList.map((og) => ({
        ...og,
        group: og.label,
        items: og.options,
      }))
    : uniqList.map((opt) => ({
        name: opt.name,
        value: opt.name,
        label: opt.label,
      }));
};

const CustomValueSelector = ({
  className,
  handleOnChange, // eslint-disable-line @typescript-eslint/unbound-method
  options,
  value,
  title,
  disabled,
  multiple,
  listsAsArrays,
  testID,
}: ValueSelectorProps) => {
  const { onChange, val } = useValueSelector({
    handleOnChange,
    listsAsArrays,
    multiple,
    value,
  });

  const data = useMemo(() => optionListToComboboxData(options), [options]);
  const changeHandler = (v: string[] | string | null) => {
    onChange(v ?? val ?? "");
  };

  return multiple ? (
    <MultiSelect
      comboboxProps={{ withinPortal: false }}
      scrollAreaProps={{ type: "auto" }}
      data-testid={testID}
      title={title}
      className={className}
      data={data}
      disabled={disabled}
      value={val as string[] | undefined}
      onChange={changeHandler}
    />
  ) : (
    <Select
      comboboxProps={{ withinPortal: false }}
      scrollAreaProps={{ type: "auto" }}
      data-testid={testID}
      title={title}
      className={className}
      value={val as string | undefined}
      data={data}
      disabled={disabled}
      onChange={changeHandler}
    />
  );
};

const FilterEditor = observer(
  ({ filterSequence }: { filterSequence: FilterSequence }) => {
    return filterSequence.potentialAttributes.length > 0 ? (
      <QueryBuilderMantine>
        <QueryBuilder
          fields={filterSequence.potentialAttributes.map((a) => a.field)}
          query={toJS(filterSequence.query)}
          showNotToggle={false}
          showShiftActions={false}
          addRuleToNewGroups={true}
          parseNumbers={true}
          maxLevels={DEFINES.maxQueryLevels}
          // eslint-disable-next-line @typescript-eslint/unbound-method
          onQueryChange={filterSequence.setQuery}
          getOperators={getOperators}
          getValueEditorType={getValueEditorType}
          validator={defaultValidator}
          controlElements={{
            removeRuleAction: RemoveButton,
            removeGroupAction: RemoveButton,
            addRuleAction: AddButton,
            addGroupAction: AddButton,
            valueSelector: CustomValueSelector,
          }}
          translations={{
            addRule: { label: "Rule", title: "Add rule" } as const,
            addGroup: { label: "Group", title: "Add group" } as const,
          }}
        />
      </QueryBuilderMantine>
    ) : null;
  },
);

export default FilterEditor;
