import { observer } from "mobx-react";
import type { Attribute } from "@/stores/nodeAttributes.ts";
import { NumberInput, Select, TextInput } from "@mantine/core";
import type { AttributeType, NodeAttributes } from "@/utils/schemas.ts";

const AttributeTextInput = ({
  attribute,
  enumValue,
  setEnumValue,
}: {
  attribute: Attribute;
  enumValue: string | undefined;
  setEnumValue: (_value: string) => void;
}) => {
  return (
    <TextInput
      label={attribute.displayName}
      value={enumValue}
      placeholder={`Enter ${attribute.displayName} value`}
      onChange={(event) => {
        setEnumValue(event.currentTarget.value);
      }}
    />
  );
};

const AttributeNumberInput = ({
  attribute,
  enumValue,
  setEnumValue,
}: {
  attribute: Attribute;
  enumValue: number | undefined;
  setEnumValue: (_value: number) => void;
}) => {
  return (
    <NumberInput
      label={attribute.displayName}
      value={enumValue}
      placeholder={`Enter ${attribute.displayName} value`}
      onChange={(event) => {
        if (typeof event === "string") return;
        setEnumValue(event);
      }}
      isAllowed={(value) => value.floatValue !== undefined}
    />
  );
};

const AttributeBooleanInput = ({
  attribute,
  enumValue,
  setEnumValue,
}: {
  attribute: Attribute;
  enumValue: boolean | undefined;
  setEnumValue: (_value: boolean) => void;
}) => {
  return (
    <Select
      label={attribute.displayName}
      placeholder={`Select ${attribute.displayName} value`}
      value={enumValue ? "Yes" : "No"}
      data={["Yes", "No"]}
      onChange={(value) => {
        if (!value) return;
        setEnumValue(value === "Yes");
      }}
      scrollAreaProps={{ type: "auto" }}
    />
  );
};

const EnumSelectorCombobox = ({
  attribute,
  enumValue,
  setEnumValue,
}: {
  attribute: Attribute;
  enumValue: string | null;
  setEnumValue: (_value: string) => void;
}) => {
  return (
    <Select
      label={attribute.displayName}
      placeholder={`Select ${attribute.displayName} value`}
      value={enumValue}
      data={attribute.values?.map((attributeValue) => ({
        value: attributeValue.name,
        label: attributeValue.displayName,
      }))}
      onChange={(value) => {
        if (!value) return;
        setEnumValue(value);
      }}
      scrollAreaProps={{ type: "auto" }}
    />
  );
};

interface AttributeSelectorsProps {
  attributes: Attribute[];
  onSetAttribute: (_attribute: Attribute, _value: AttributeType) => void;
  // nodeSource: NodeSource;
  values: NodeAttributes;
}

const AttributeSelectors = observer(
  ({ attributes, onSetAttribute, values }: AttributeSelectorsProps) => {
    return (
      <>
        {attributes.map((attribute) => {
          if (attribute.type === "enum") {
            return (
              <EnumSelectorCombobox
                key={attribute.id}
                attribute={attribute}
                enumValue={
                  attribute.name in values
                    ? (values[attribute.name] as string)
                    : null
                }
                setEnumValue={(value) => {
                  if (!value) return;
                  onSetAttribute(attribute, value);
                }}
              />
            );
          } else if (attribute.type === "text") {
            return (
              <AttributeTextInput
                key={attribute.id}
                attribute={attribute}
                enumValue={
                  attribute.name in values
                    ? (values[attribute.name] as string)
                    : undefined
                }
                setEnumValue={(value) => {
                  if (!value) return;
                  onSetAttribute(attribute, value);
                }}
              />
            );
          } else if (attribute.type === "number") {
            return (
              <AttributeNumberInput
                key={attribute.id}
                attribute={attribute}
                enumValue={
                  attribute.name in values
                    ? (values[attribute.name] as number)
                    : undefined
                }
                setEnumValue={(value) => {
                  if (!value) return;
                  onSetAttribute(attribute, value);
                }}
              />
            );
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          } else if (attribute.type === "boolean") {
            return (
              <AttributeBooleanInput
                key={attribute.id}
                attribute={attribute}
                enumValue={
                  attribute.name in values
                    ? (values[attribute.name] as boolean)
                    : undefined
                }
                setEnumValue={(value) => {
                  if (!value) return;
                  onSetAttribute(attribute, value);
                }}
              />
            );
          }
        })}
      </>
    );
  },
);

export default AttributeSelectors;
