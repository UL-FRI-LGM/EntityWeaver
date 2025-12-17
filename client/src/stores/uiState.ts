import { type AppState } from "@/stores/appState.ts";
import { makeAutoObservable } from "mobx";
import { isHydrated, makePersistable } from "mobx-persist-store";

interface Filters {
  entities: boolean;
  documents: boolean;
  mentions: boolean;
  collocations: boolean;
}

export type tableContents = "documents" | "entities" | "mentions";

export class UiState {
  appState: AppState;

  highlightOnSelect = true;
  highlightOnHover = true;
  entityView = false;
  mentionContextOpen = false;
  documentEditMode = false;
  tableView = false;
  tableContents: tableContents = "documents";

  filters: Filters = {
    entities: true,
    documents: true,
    mentions: true,
    collocations: false,
  };

  constructor(appState: AppState) {
    this.appState = appState;

    makeAutoObservable(this, { appState: false });

    makePersistable(this, {
      name: "NERVIS-UIState",
      properties: [
        "highlightOnSelect",
        "highlightOnHover",
        "entityView",
        "filters",
        "documentEditMode",
        "tableView",
        "tableContents",
      ],
    }).catch(console.error);
  }

  toggleFilter(key: keyof Filters) {
    this.filters[key] = !this.filters[key];
  }

  get isReloading() {
    return isHydrated(this);
  }

  setMentionContextOpen(state: boolean) {
    this.mentionContextOpen = state;
  }

  setDocumentEditMode(state: boolean) {
    this.documentEditMode = state;
  }

  setTableView(state: boolean) {
    this.tableView = state;
  }

  setTableContents(contents: tableContents) {
    this.tableContents = contents;
  }
}
