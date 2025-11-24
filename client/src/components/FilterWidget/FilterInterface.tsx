import { observer } from "mobx-react";
import { QueryBuilderMantine } from "@react-querybuilder/mantine";
import {
  type ActionProps,
  defaultOperators,
  type Field,
  QueryBuilder,
} from "react-querybuilder";
import { FilterSequence } from "@/stores/filters.ts";
import { toJS } from "mobx";
import { ActionIcon, Button } from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";

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

const FilterEditor = observer(
  ({ filterSequence }: { filterSequence: FilterSequence }) => {
    return (
      <QueryBuilderMantine>
        <QueryBuilder
          fields={filterSequence.potentialAttributes.map((a) => a.field)}
          defaultQuery={toJS(filterSequence.query)}
          // eslint-disable-next-line @typescript-eslint/unbound-method
          onQueryChange={filterSequence.setQuery}
          getOperators={getOperators}
          getValueEditorType={getValueEditorType}
          controlElements={{
            removeRuleAction: RemoveButton,
            removeGroupAction: RemoveButton,
            addRuleAction: AddButton,
            addGroupAction: AddButton,
          }}
          translations={{
            addRule: { label: "Rule", title: "Add rule" } as const,
            addGroup: { label: "Group", title: "Add group" } as const,
          }}
        />
      </QueryBuilderMantine>
    );
  },
);

export default FilterEditor;
