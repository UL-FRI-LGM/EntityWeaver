import { observer } from "mobx-react";
import type { GraphNodeType } from "@/stores/dataset.ts";
import { ColorInput, Group, Radio, Stack, Select } from "@mantine/core";
import { useState } from "react";
import { useAppState } from "@/stores/appState.ts";
import type { Attribute } from "@/stores/filters.ts";
import classes from "./EntityTypeProperties.module.css";

interface Props {
  entityType: GraphNodeType;
}

const EnumColorPicker = observer(
  ({ attribute, disabled }: { attribute: Attribute; disabled: boolean }) => {
    return attribute.values?.map((attributeValue) => {
      return (
        <Group justify={"space-between"} key={attributeValue.name}>
          {attributeValue.label ?? attributeValue.name}
          <ColorInput
            className={classes.enumColorInput}
            withEyeDropper={false}
            disabled={disabled}
            value={attributeValue.color}
          />
        </Group>
      );
    });
  },
);

const EntityTypeProperties = observer(({ entityType }: Props) => {
  const appState = useAppState();

  const [colorSource, setColorSource] = useState<string>("type");
  const attributes = appState.dataset.filterManager.attributes.get(entityType);
  const colorValidAttributes = attributes
    ? attributes.filter(({ type }) => type === "number" || type === "enum")
    : null;

  const [colorAttribute, setColorAttribute] = useState<Attribute | null>(null);

  return (
    <Stack>
      {entityType} Node Color
      <Group justify={"space-between"}>
        <Group>
          <Radio
            checked={colorSource === "type"}
            onChange={() => {
              setColorSource("type");
            }}
          />
          By Type
        </Group>
        <ColorInput
          style={{ width: 230 }}
          withEyeDropper={false}
          disabled={colorSource !== "type"}
          value={appState.dataset.filterManager.typeColors.get(entityType)}
        />
      </Group>
      {colorValidAttributes !== null && colorValidAttributes.length > 0 && (
        <Stack>
          <Group>
            <Radio
              checked={colorSource === "attribute"}
              onChange={() => {
                setColorSource("attribute");
              }}
            />
            By Attribute
            <Select
              style={{ width: 230 }}
              placeholder="Select Attribute"
              disabled={colorSource !== "attribute"}
              data={colorValidAttributes.map(({ name }) => name)}
              value={colorAttribute?.name || null}
              onChange={(value) => {
                setColorAttribute(
                  colorValidAttributes.find(
                    (attribute) => attribute.name === value,
                  ) || null,
                );
              }}
            />
          </Group>
          {colorAttribute !== null && colorAttribute.type === "enum" && (
            <EnumColorPicker
              attribute={colorAttribute}
              disabled={colorSource !== "attribute"}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
});

export default EntityTypeProperties;
