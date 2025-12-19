import { observer } from "mobx-react";
import {
  ColorInput,
  Group,
  Radio,
  Stack,
  Select,
  type SelectProps,
  Tabs,
} from "@mantine/core";
import { useState } from "react";
import classes from "./EntityTypeProperties.module.css";
import { IconCheck } from "@tabler/icons-react";
import { type Attribute, NodeTypeProperties } from "@/stores/nodeAttributes.ts";
import { IconMap, Icons } from "@/utils/iconsHelper.tsx";
import GradientEditor from "@/components/GradientEditor/GradientEditor.tsx";
import type { GradientStopsHandler } from "@/stores/gradientStopsHandler.ts";

const renderGlyphOption: SelectProps["renderOption"] = ({
  option,
  checked,
}) => (
  <Group flex="1" gap="xs">
    {IconMap.get(option.value)?.component}
    {option.label}
    {checked && <IconCheck style={{ marginInlineStart: "auto" }} />}
  </Group>
);

const EnumColorPicker = observer(
  ({ attribute, disabled }: { attribute: Attribute; disabled: boolean }) => {
    return attribute.values?.map((attributeValue) => {
      return (
        <Group justify={"space-between"} key={attributeValue.name}>
          {attributeValue.displayName}
          <ColorInput
            className={classes.enumColorInput}
            withEyeDropper={false}
            disabled={disabled}
            value={attributeValue.color}
            onChangeEnd={(color) => {
              attributeValue.setColor(color);
            }}
          />
        </Group>
      );
    });
  },
);

const NumberColorPicker = observer(
  ({
    gradientStopsHandler,
    // disabled,
  }: {
    gradientStopsHandler: GradientStopsHandler;
    // disabled: boolean;
  }) => {
    return (
      <div style={{ marginTop: 10 }}>
        <GradientEditor gradientStopsHandler={gradientStopsHandler} />
      </div>
    );
  },
);

const EnumGlyphPicker = observer(
  ({ attribute, disabled }: { attribute: Attribute; disabled: boolean }) => {
    return attribute.values?.map((attributeValue) => {
      return (
        <Group justify={"space-between"} key={attributeValue.name}>
          {attributeValue.displayName}
          <Select
            className={classes.enumColorInput}
            disabled={disabled}
            placeholder="Select glyph"
            value={attributeValue.glyph?.name}
            data={Icons.map(({ name }) => name)}
            renderOption={renderGlyphOption}
            scrollAreaProps={{ type: "auto" }}
            onChange={(value) => {
              if (!value) return;
              attributeValue.setGlyph(value);
            }}
          />
        </Group>
      );
    });
  },
);

const EntityColorProperties = observer(
  ({ properties }: { properties: NodeTypeProperties }) => {
    const colorValidAttributes = properties.attributes.filter(
      (attribute) => attribute.isValidColorAttribute,
    );

    return (
      <Stack>
        <Group justify={"space-between"}>
          <Group>
            <Radio
              checked={properties.colorSource === "type"}
              onChange={() => {
                properties.setColorSource("type");
              }}
            />
            By Type
          </Group>
          <ColorInput
            style={{ width: 230 }}
            withEyeDropper={false}
            disabled={properties.colorSource !== "type"}
            value={properties.typeColor}
            onChangeEnd={(color) => {
              properties.setTypeColor(color);
            }}
          />
        </Group>
        {colorValidAttributes.length > 0 && (
          <Stack gap={"xs"}>
            <Group>
              <Radio
                checked={properties.colorSource === "attribute"}
                onChange={() => {
                  properties.setColorSource("attribute");
                }}
              />
              By Attribute
              <Select
                style={{ width: 230 }}
                placeholder="Select Attribute"
                disabled={properties.colorSource !== "attribute"}
                data={colorValidAttributes.map((attribute) => ({
                  value: attribute.name,
                  label: attribute.displayName,
                }))}
                value={properties.colorAttribute?.name ?? null}
                onChange={(value) => {
                  if (value === null) {
                    return;
                  }
                  properties.setColorAttribute(value);
                }}
              />
            </Group>
            {properties.colorAttribute?.type === "enum" && (
              <EnumColorPicker
                attribute={properties.colorAttribute}
                disabled={properties.colorSource !== "attribute"}
              />
            )}
            {properties.colorAttribute?.type === "number" &&
              properties.colorAttribute.gradientStopsHandler && (
                <NumberColorPicker
                  gradientStopsHandler={
                    properties.colorAttribute.gradientStopsHandler
                  }
                />
              )}
          </Stack>
        )}
      </Stack>
    );
  },
);

const EntityGlyphProperties = observer(
  ({ properties }: { properties: NodeTypeProperties }) => {
    const glyphValidAttributes = properties.attributes.filter(
      (attribute) => attribute.isValidGlyphAttribute,
    );

    return (
      <Stack>
        <Group justify={"space-between"}>
          <Group>
            <Radio
              checked={properties.glyphSource === "type"}
              onChange={() => {
                properties.setGlyphSource("type");
              }}
            />
            By Type
          </Group>
          <Select
            style={{ width: 230 }}
            placeholder="Select glyph"
            value={properties.typeGlyph.name}
            data={Icons.map(({ name }) => name)}
            onChange={(value) => {
              if (!value) return;
              properties.setTypeGlyph(value);
            }}
            renderOption={renderGlyphOption}
            scrollAreaProps={{ type: "auto" }}
          />
        </Group>
        {glyphValidAttributes.length > 0 && (
          <Stack gap={"xs"}>
            <Group>
              <Radio
                checked={properties.glyphSource === "attribute"}
                onChange={() => {
                  properties.setGlyphSource("attribute");
                }}
              />
              By Attribute
              <Select
                style={{ width: 230 }}
                placeholder="Select Attribute"
                disabled={properties.glyphSource !== "attribute"}
                data={glyphValidAttributes.map((attribute) => ({
                  value: attribute.name,
                  label: attribute.displayName,
                }))}
                value={properties.glyphAttribute?.name || null}
                onChange={(value) => {
                  if (value === null) return;
                  properties.setGlyphAttribute(value);
                }}
              />
            </Group>
            {properties.glyphAttribute?.type === "enum" && (
              <EnumGlyphPicker
                attribute={properties.glyphAttribute}
                disabled={properties.glyphSource !== "attribute"}
              />
            )}
          </Stack>
        )}
      </Stack>
    );
  },
);

const EntityTypeProperties = observer(
  ({ properties }: { properties: NodeTypeProperties }) => {
    const [selectedView, setSelectedView] = useState<string>("color");

    return (
      <Stack>
        <Tabs
          value={selectedView}
          onChange={(value) => {
            setSelectedView(value ?? "color");
          }}
        >
          <Tabs.List grow>
            <Tabs.Tab value="color">{properties.nodeType} Node Color</Tabs.Tab>
            <Tabs.Tab value="glyph">{properties.nodeType} Node Glyph</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        {selectedView === "color" && (
          <EntityColorProperties properties={properties} />
        )}
        {selectedView === "glyph" && (
          <EntityGlyphProperties properties={properties} />
        )}
      </Stack>
    );
  },
);

export default EntityTypeProperties;
