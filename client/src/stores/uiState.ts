import { appState, type AppState } from "@/stores/appState.ts";
import { makeAutoObservable, observable } from "mobx";
import { setColorByType } from "@/utils/graphHelpers.ts";
import { isHydrated, makePersistable } from "mobx-persist-store";

export class UiState {
  appState: AppState;

  highlightOnSelect = true;
  highlightOnHover = true;
  entityView = false;
  _colorByType = false;
  filters = {
    entities: true,
    documents: true,
    mentions: true,
    people: true,
    locations: true,
    organizations: true,
    miscellaneous: true,
    collocations: false,
  };

  constructor(appState: AppState) {
    this.appState = appState;
    makeAutoObservable(this, { filters: observable.struct });

    makePersistable(this, {
      name: "NERVIS-UIState",
      properties: [
        "highlightOnSelect",
        "highlightOnHover",
        "entityView",
        "_colorByType",
        "filters",
      ],
    }).catch((error) => {
      console.error(error);
    });
  }

  get isReloading() {
    return isHydrated(this);
  }

  get colorByType() {
    return this._colorByType;
  }

  set colorByType(state: boolean) {
    this._colorByType = state;
    setColorByType(appState.sigma, state);
  }
}
