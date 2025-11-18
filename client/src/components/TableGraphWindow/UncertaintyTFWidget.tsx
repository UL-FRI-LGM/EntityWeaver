import classes from "./UncertaintyTFWidget.module.css";
import Color from "color";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { ActionIcon, ColorInput, Group, Stack } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { observer } from "mobx-react";
import { useAppState } from "@/stores/appState.ts";
import type { GradientStopsHandler } from "@/stores/gradientStopsHandler.ts";

interface ColorStop {
  color: string;
  position: number;
}

interface GradientEditorProps {
  gradientStopsHandler: GradientStopsHandler;
}

const GradientEditor = observer(
  ({ gradientStopsHandler }: GradientEditorProps) => {
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

    return (
      <Stack align={"center"} gap={"30px"}>
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
        <Group>
          <ColorInput
            format={"hsla"}
            className={classes.colorInput}
            withEyeDropper={false}
            disabled={gradientStopsHandler.selectedTFStop === null}
            value={
              gradientStopsHandler.selectedTFStop === null
                ? undefined
                : new Color(gradientStopsHandler.selectedTFStop.color)
                    .hsl()
                    .string()
            }
            onChangeEnd={(color) => {
              if (gradientStopsHandler.selectedTFStop !== null) {
                gradientStopsHandler.selectedTFStop.setColor(color);
              }
            }}
          />
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

const UncertaintyTFWidget = observer(() => {
  const appState = useAppState();

  return (
    <div className={classes.container}>
      <GradientEditor gradientStopsHandler={appState.tfStops} />
    </div>
  );
});

export default UncertaintyTFWidget;
