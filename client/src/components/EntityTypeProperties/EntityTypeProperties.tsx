import { observer } from "mobx-react";
import type { GraphNodeType } from "@/stores/dataset.ts";
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
import { useAppState } from "@/stores/appState.ts";
import type { Attribute } from "@/stores/filters.ts";
import classes from "./EntityTypeProperties.module.css";
import {
  IconAt,
  IconBorderSides,
  IconCheck,
  IconDotsCircleHorizontal,
  IconFile,
  IconMapPin,
  IconSitemap,
  IconUserCircle,
} from "@tabler/icons-react";

interface Props {
  entityType: GraphNodeType;
}

const glyphs = [
  { name: "At", icon: <IconAt size={14} /> },
  { name: "Box", icon: <IconBorderSides size={14} /> },
  { name: "File", icon: <IconFile size={14} /> },
  { name: "Person", icon: <IconUserCircle size={14} /> },
  { name: "Hierarchy", icon: <IconSitemap size={14} /> },
  { name: "Map Pin", icon: <IconMapPin size={14} /> },
  { name: "Dot", icon: <IconDotsCircleHorizontal size={14} /> },
];

const defaultGlyphs = {
  Document: glyphs[2],
  Mention: glyphs[0],
  Entity: glyphs[1],
  PER: glyphs[3],
  ORG: glyphs[4],
  LOC: glyphs[5],
  MISC: glyphs[6],
};

const renderSelectOption: SelectProps["renderOption"] = ({
  option,
  checked,
}) => (
  <Group flex="1" gap="xs">
    {glyphs.find((glyph) => option.value === glyph.name)?.icon}
    {option.label}
    {checked && <IconCheck style={{ marginInlineStart: "auto" }} />}
  </Group>
);

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

const EnumGlyphPicker = observer(
  ({ attribute, disabled }: { attribute: Attribute; disabled: boolean }) => {
    return attribute.values?.map((attributeValue) => {
      return (
        <Group justify={"space-between"} key={attributeValue.name}>
          {attributeValue.label ?? attributeValue.name}
          <Select
            className={classes.enumColorInput}
            disabled={disabled}
            placeholder="Select glyph"
            value={
              // @ts-expect-error it is so bad
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              defaultGlyphs[attributeValue.name]?.name
            }
            data={glyphs.map((glyph) => glyph.name)}
            renderOption={renderSelectOption}
            scrollAreaProps={{ type: "auto" }}
          />
        </Group>
      );
    });
  },
);

const EntityTypeProperties = observer(({ entityType }: Props) => {
  const appState = useAppState();

  const [selectedView, setSelectedView] = useState<string>("color");

  const [colorSource, setColorSource] = useState<string>("type");
  const attributes = appState.dataset.filterManager.attributes.get(entityType);
  const [colorAttribute, setColorAttribute] = useState<Attribute | null>(null);
  const colorValidAttributes = attributes
    ? attributes.filter(({ type }) => type === "enum")
    : null;

  const [glyphSource, setGlyphSource] = useState<string>("type");
  const glyphValidAttributes = attributes
    ? attributes.filter(({ type }) => type === "enum")
    : null;
  const [glyphAttribute, setGlyphAttribute] = useState<Attribute | null>(null);

  return (
    <Stack>
      <Tabs
        value={selectedView}
        onChange={(value) => {
          setSelectedView(value ?? "color");
        }}
      >
        <Tabs.List grow>
          <Tabs.Tab value="color">{entityType} Node Color</Tabs.Tab>
          <Tabs.Tab value="glyph">{entityType} Node Glyph</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {selectedView === "color" && (
        <Stack>
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
      )}
      {selectedView === "glyph" && (
        <Stack>
          <Group justify={"space-between"}>
            <Group>
              <Radio
                checked={glyphSource === "type"}
                onChange={() => {
                  setGlyphSource("type");
                }}
              />
              By Type
            </Group>
            <Select
              style={{ width: 230 }}
              placeholder="Select glyph"
              value={defaultGlyphs[entityType].name}
              data={glyphs.map((glyph) => glyph.name)}
              renderOption={renderSelectOption}
              scrollAreaProps={{ type: "auto" }}
            />
          </Group>
          {glyphValidAttributes !== null && glyphValidAttributes.length > 0 && (
            <Stack gap={"xs"}>
              <Group>
                <Radio
                  checked={glyphSource === "attribute"}
                  onChange={() => {
                    setGlyphSource("attribute");
                  }}
                />
                By Attribute
                <Select
                  style={{ width: 230 }}
                  placeholder="Select Attribute"
                  disabled={glyphSource !== "attribute"}
                  data={glyphValidAttributes.map(({ name }) => name)}
                  value={glyphAttribute?.name || null}
                  onChange={(value) => {
                    setGlyphAttribute(
                      glyphValidAttributes.find(
                        (attribute) => attribute.name === value,
                      ) || null,
                    );
                  }}
                />
              </Group>
              {glyphAttribute !== null && glyphAttribute.type === "enum" && (
                <EnumGlyphPicker
                  attribute={glyphAttribute}
                  disabled={glyphSource !== "attribute"}
                />
              )}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
});

export default EntityTypeProperties;
