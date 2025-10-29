import { appState, type AppState } from "@/stores/appState.ts";
import { makeAutoObservable } from "mobx";
import { setColorByType } from "@/utils/graphHelpers.ts";
import { isHydrated, makePersistable } from "mobx-persist-store";

interface Filters {
  entities: boolean;
  documents: boolean;
  mentions: boolean;
  people: boolean;
  locations: boolean;
  organizations: boolean;
  miscellaneous: boolean;
  collocations: boolean;
}

export class UiState {
  appState: AppState;

  highlightOnSelect = true;
  highlightOnHover = true;
  entityView = false;
  colorByType = false;
  mentionContextOpen = false;
  documentEditMode = false;
  filters: Filters = {
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
    makeAutoObservable(this);

    makePersistable(this, {
      name: "NERVIS-UIState",
      properties: [
        "highlightOnSelect",
        "highlightOnHover",
        "entityView",
        "colorByType",
        "filters",
        "documentEditMode",
      ],
    }).catch((error) => {
      console.error(error);
    });
  }

  toggleFilter<Key extends keyof Filters>(key: Key) {
    this.filters[key] = !this.filters[key];
  }

  get isReloading() {
    return isHydrated(this);
  }

  setColorByType(state: boolean) {
    this.colorByType = state;
    setColorByType(appState.sigma, state);
  }

  setMentionContextOpen(state: boolean) {
    this.mentionContextOpen = state;
  }

  setDocumentEditMode(state: boolean) {
    this.documentEditMode = state;
  }
}
