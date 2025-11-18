import { RangeSlider, Group, ColorInput } from "@mantine/core";
import classes from "./UncertaintyTFWidget.module.css";
import Color, { type ColorInstance } from "color";
import { useState } from "react";

interface Level {
  threshold: number;
  minCertainColor: ColorInstance;
  maxCertainColor: ColorInstance;
}

const initialLevels: Level[] = [
  {
    threshold: 0.5,
    minCertainColor: new Color("hsl(360, 100%, 68%)"),
    maxCertainColor: new Color("hsl(360, 0%, 68%)"),
  },
  {
    threshold: 1.0,
    minCertainColor: new Color("hsl(360, 100%, 68%)"),
    maxCertainColor: new Color("hsl(360, 0%, 68%)"),
  },
];

const UncertaintyTFWidget = () => {
  const [levels, setLevels] = useState<Level[]>(initialLevels);

  return (
    <div className={classes.container}>
      {levels.map((level, index) => {
        const prevThreshold = index === 0 ? 0 : levels[index - 1].threshold;
        const colorMin = level.minCertainColor.hex();
        const colorMax = level.maxCertainColor.hex();
        const gradientStyle = {
          backgroundColor: `linear-gradient(to right, ${colorMin} 0%, ${colorMax} 100%)`,
        };
        return (
          <Group key={level.threshold}>
            <RangeSlider
              style={{ width: "300px" }}
              styles={{ bar: gradientStyle }}
              step={1}
              color={"pink"}
              defaultValue={[prevThreshold * 100, level.threshold * 100]}
            />
            <ColorInput
              label="Minimum"
              value={colorMin}
              onChange={(color) => {
                setLevels((levels) => {
                  const newLevels = [...levels];
                  newLevels[index] = {
                    ...newLevels[index],
                    minCertainColor: new Color(color),
                  };
                  return newLevels;
                });
              }}
            />
            <ColorInput
              label="Maximum"
              value={colorMax}
              onChange={(color) => {
                setLevels((levels) => {
                  const newLevels = [...levels];
                  newLevels[index] = {
                    ...newLevels[index],
                    maxCertainColor: new Color(color),
                  };
                  return newLevels;
                });
              }}
            />
          </Group>
        );
      })}
      {/*<RangeSlider color="blue" defaultValue={[20, 60]} />*/}
    </div>
  );
};

export default UncertaintyTFWidget;
