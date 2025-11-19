import type { AppState } from "@/stores/appState.ts";
import { makeAutoObservable } from "mobx";
import { DEFINES } from "@/defines.ts";
import { v4 as uuiv4 } from "uuid";
import { refreshEdgeColorsBasedOnUncertainty } from "@/utils/graphHelpers.ts";
import Color from "color";

export class GradientStop {
  position: number;
  color: string;
  key: string;
  handler: GradientStopsHandler;

  constructor(position: number, color: string, handler: GradientStopsHandler) {
    this.position = position;
    this.color = color;
    this.handler = handler;
    this.key = uuiv4();

    makeAutoObservable(this, { key: false, handler: false });
  }

  setColor(color: string) {
    const newColor = new Color(color);
    this.color = newColor.hexa();

    this.handler.onTFStopsChanged();
  }

  setPosition(position: number) {
    this.position = position;

    this.handler.onTFStopsChanged();
  }
}

export class GradientStopsHandler {
  appState: AppState;
  stops: GradientStop[] = [];
  selectedStopIndex: number | null = null;

  minShownValue = 0;
  maxShownValue = 1;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(appState: AppState) {
    this.appState = appState;
    for (const stop of DEFINES.defaultTFStops) {
      this.stops.push(
        new GradientStop(stop.threshold, stop.color.hexa(), this),
      );
    }
    makeAutoObservable(this, { appState: false, onTFStopsChanged: false });
  }

  get sortedTFStops() {
    return this.stops.slice().sort((a, b) => a.position - b.position);
  }

  get selectedTFStop() {
    if (
      this.selectedStopIndex === null ||
      this.selectedStopIndex < 0 ||
      this.selectedStopIndex >= this.stops.length
    ) {
      return null;
    }
    return this.stops[this.selectedStopIndex];
  }

  setSelectedStopIndex(index: number | null) {
    this.selectedStopIndex = index;
  }

  setMinMaxShownValues(min: number, max: number) {
    this.minShownValue = min;
    this.maxShownValue = max;

    this.onTFStopsChanged();
  }

  addTFStop(position: number, color: string) {
    const newStop = new GradientStop(position, color, this);
    this.stops.push(newStop);
    this.stops.sort((a, b) => a.position - b.position);

    this.onTFStopsChanged();
    return this.stops.indexOf(newStop);
  }

  removeTFStop(index: number) {
    this.stops.splice(index, 1);
    if (this.selectedStopIndex === index) {
      this.setSelectedStopIndex(null);
    }
    this.onTFStopsChanged();
  }

  onTFStopsChanged() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      refreshEdgeColorsBasedOnUncertainty(this.appState);
    }, DEFINES.gradientEditorDebounceMs);
  }
}
