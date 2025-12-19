import { observer } from "mobx-react";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  HorizontalCoordinatesGenerator,
  VerticalCoordinatesGenerator,
} from "recharts/types/cartesian/CartesianGrid";
import {
  ActionIcon,
  ColorInput,
  Group,
  Popover,
  RangeSlider,
  Space,
  Stack,
} from "@mantine/core";
import {
  Area,
  AreaChart,
  CartesianGrid,
  type TooltipContentProps,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import classes from "@/components/TableGraphWindow/UncertaintyTFWidget.module.css";
import Color from "color";
import ColorPicker from "react-best-gradient-color-picker";
import { IconTrash } from "@tabler/icons-react";
import type { GradientStopsHandler } from "@/stores/gradientStopsHandler.ts";
import type { BinInfo } from "@/stores/dataset.ts";

interface ColorStop {
  color: string;
  position: number;
}

interface GradientEditorProps {
  gradientStopsHandler: GradientStopsHandler;
  binData: BinInfo[];
}

const HistogramTooltip = ({
  active,
  payload,
}: TooltipContentProps<number, string>) => {
  const isVisible =
    active &&
    payload.length > 0 &&
    "value" in payload[0] &&
    "payload" in payload[0];
  const payloadObject = payload[0] as {
    payload: BinInfo & { bin: number };
    value: number;
  };
  return (
    <div
      style={{
        border: "1px solid",
        borderRadius: "8px",
        height: "fit-content",
        margin: "0",
        padding: "2px 4px",
        backgroundColor: "black",
        visibility: isVisible ? "visible" : "hidden",
      }}
    >
      {isVisible && (
        <>{`${payloadObject.payload.bin.toString()}-${(payloadObject.payload.bin + 1).toString()}% : ${payloadObject.payload.count.toString()} (${(payloadObject.payload.relative * 100).toFixed(2)}%)`}</>
      )}
    </div>
  );
};

const GradientEditor = observer(
  ({ gradientStopsHandler, binData }: GradientEditorProps) => {
    const gradientBoxRef = useRef<HTMLDivElement>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [newStop, setNewStop] = useState<ColorStop | null>(null);

    const handleMouseHover = (event: ReactMouseEvent) => {
      if (!gradientBoxRef.current) return;
      const rect = gradientBoxRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;

      for (const stop of gradientStopsHandler.stops) {
        const stopX = stop.position * rect.width;
        if (Math.abs(mouseX - stopX) < 20) {
          setNewStop(null);
          return;
        }
      }

      let newPos = mouseX / rect.width;
      newPos = Math.min(1, Math.max(0, newPos));
      setNewStop({ color: "#767676", position: newPos });
    };

    const handleMouseDown = (index: number) => (event: ReactMouseEvent) => {
      event.preventDefault();
      if (draggingIndex !== null) return;
      setDraggingIndex(index);
      gradientStopsHandler.setSelectedStopIndex(index);
    };

    const handleMouseMove = useCallback(
      (event: MouseEvent) => {
        if (draggingIndex === null || !gradientBoxRef.current) return;
        const rect = gradientBoxRef.current.getBoundingClientRect();
        let newPos = (event.clientX - rect.left) / rect.width;
        newPos = Math.min(1, Math.max(0, newPos));
        gradientStopsHandler.stops[draggingIndex].setPosition(newPos);
      },
      [draggingIndex, gradientStopsHandler],
    );

    const handleMouseUp = () => {
      setDraggingIndex(null);
    };

    useEffect(() => {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [draggingIndex, handleMouseMove]);

    const gradientCSS = gradientStopsHandler.sortedTFStops
      .map((stop) => `${stop.color} ${(stop.position * 100).toString()}%`)
      .join(", ");

    const verticalCoordinatesGenerator: VerticalCoordinatesGenerator = (
      props,
    ) => {
      const pixelsPerTick = 20;
      const ticks = Math.ceil((props.width - 10) / pixelsPerTick) + 1;
      return Array.from({ length: ticks + 1 }, (_, i) => i * pixelsPerTick + 5);
    };

    const horizontalCoordinatesGenerator: HorizontalCoordinatesGenerator = (
      props,
    ) => {
      const pixelsPerTick = 30;
      const ticks = Math.ceil((props.height - 10) / pixelsPerTick) + 1;
      return Array.from({ length: ticks }, (_, i) => i * pixelsPerTick + 5);
    };

    return (
      <Stack align={"center"} gap={"5px"}>
        <AreaChart
          className={classes.histogram}
          responsive={true}
          data={binData.map(({ value, count, relative }, index) => ({
            bin: index,
            value,
            count,
            relative,
          }))}
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={1} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={"#aaaaaaaa"}
            style={{
              backgroundColor: "rgb(255, 255, 255, 0.05)",
            }}
            strokeDasharray="3 3"
            verticalCoordinatesGenerator={verticalCoordinatesGenerator}
            horizontalCoordinatesGenerator={horizontalCoordinatesGenerator}
          />
          <XAxis
            dataKey="bin"
            allowDecimals={false}
            padding={"no-gap"}
            scale="point"
            hide={true}
            style={{ padding: 0, margin: 0 }}
          />
          <YAxis width="auto" hide={true} />
          <RechartsTooltip
            isAnimationActive={false}
            content={HistogramTooltip}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorUv)"
            isAnimationActive={false}
          />
        </AreaChart>
        <RangeSlider
          className={classes.slider}
          // size="sm"
          defaultValue={[0, 1]}
          value={[
            gradientStopsHandler.minShownValue,
            gradientStopsHandler.maxShownValue,
          ]}
          onChange={([min, max]) => {
            gradientStopsHandler.setMinMaxShownValues(min, max);
          }}
          min={0}
          max={1}
          minRange={0}
          step={0.01}
          label={(value) => `${(value * 100).toString()}%`}
        ></RangeSlider>
        <div
          ref={gradientBoxRef}
          className={classes.gradientContainer}
          onMouseMove={handleMouseHover}
          onMouseLeave={() => {
            setNewStop(null);
          }}
        >
          <div
            className={classes.gradientBox}
            style={{
              background: `linear-gradient(to right, ${gradientCSS})`,
            }}
          />
          {gradientStopsHandler.stops.map((stop, index) => (
            <div
              key={stop.key}
              onMouseDown={handleMouseDown(index)}
              className={classes.gradientStop}
              style={{
                left: `${(stop.position * 100).toString()}%`,
                backgroundColor: stop.color,
                borderWidth:
                  gradientStopsHandler.selectedStopIndex === index
                    ? "4px"
                    : undefined,
              }}
            />
          ))}
          {newStop && (
            <div
              className={classes.gradientStop}
              style={{
                left: `${(newStop.position * 100).toString()}%`,
                backgroundColor: newStop.color,
                borderStyle: "dashed",
              }}
              onClick={() => {
                const newIndex = gradientStopsHandler.addTFStop(
                  newStop.position,
                  newStop.color,
                );
                gradientStopsHandler.setSelectedStopIndex(newIndex);
                setNewStop(null);
              }}
            />
          )}
        </div>
        <Space h={30} />
        <Group w={"100%"}>
          <Popover>
            <Popover.Target>
              <ColorInput
                format={"hex"}
                className={classes.colorInput}
                styles={{ dropdown: { overflow: "hidden" } }}
                withEyeDropper={false}
                fixOnBlur={true}
                withPicker={false}
                disabled={gradientStopsHandler.selectedTFStop === null}
                value={
                  gradientStopsHandler.selectedTFStop === null
                    ? undefined
                    : new Color(gradientStopsHandler.selectedTFStop.color).hex()
                }
                onChange={(color) => {
                  if (gradientStopsHandler.selectedTFStop !== null) {
                    const hex = new Color(color).hex();
                    gradientStopsHandler.selectedTFStop.setColor(hex);
                  }
                }}
              />
            </Popover.Target>
            <Popover.Dropdown>
              <ColorPicker
                className={classes.colorPicker}
                hideOpacity
                hideColorGuide
                hideColorTypeBtns
                hidePresets
                hideEyeDrop
                height={100}
                width={221}
                value={
                  gradientStopsHandler.selectedTFStop === null
                    ? undefined
                    : new Color(gradientStopsHandler.selectedTFStop.color).hex()
                }
                onChange={(color) => {
                  if (gradientStopsHandler.selectedTFStop !== null) {
                    const hex = new Color(color).hex();
                    gradientStopsHandler.selectedTFStop.setColor(hex);
                  }
                }}
              />
            </Popover.Dropdown>
          </Popover>

          <ActionIcon
            variant={"filled"}
            color={"var(--mantine-color-red-9)"}
            disabled={
              gradientStopsHandler.selectedTFStop === null ||
              gradientStopsHandler.stops.length < 2
            }
            onClick={() => {
              if (
                gradientStopsHandler.selectedStopIndex === null ||
                gradientStopsHandler.stops.length < 2
              )
                return;
              gradientStopsHandler.removeTFStop(
                gradientStopsHandler.selectedStopIndex,
              );
            }}
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Group>
      </Stack>
    );
  },
);

export default GradientEditor;
