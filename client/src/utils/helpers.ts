import { DEFINES } from "../defines.ts";
import type { DatasetDB } from "@/stores/dataset.ts";

export async function sendApiRequest(
  url: string,
  request: RequestInit,
  options?: { query?: Record<string, string> },
) {
  if (!request.method) {
    throw new Error("The 'method' option is required.");
  }
  const defaultOptions: RequestInit = {};

  if (options?.query !== undefined) {
    url += "?" + new URLSearchParams(options.query);
  }

  const fetchOptions = { ...defaultOptions, ...request };

  let errorMsg = "Error connecting to the server.";

  const response = await fetch(
    `http://localhost:3000/api/${url}`,
    fetchOptions,
  );

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type");
    const isJson = contentType?.includes("application/json");
    const content = isJson ? await response.json() : await response.text();

    errorMsg = isJson ? content.message : content;

    console.error(
      `Error when calling ${url}: (${response.status}) ${errorMsg}`,
    );
    throw new Error(errorMsg);
  }
  return response;
}

export async function loadDemo() {
  const response = await fetch("/demo.json");
  const data: DatasetDB = await response.json();
  return data;
}

export function typeToString(type: string) {
  if (type in DEFINES.entityTypes.names)
    return DEFINES.entityTypes.names[
      type as keyof typeof DEFINES.entityTypes.names
    ];
  return type;
}

export function typeToColor(type: string) {
  if (type in DEFINES.entityTypes.colors)
    return DEFINES.entityTypes.colors[
      type as keyof typeof DEFINES.entityTypes.colors
    ];
  return null;
}

export function typeIconToColor(type: string) {
  if (type in DEFINES.entityTypes.iconColor)
    return DEFINES.entityTypes.iconColor[
      type as keyof typeof DEFINES.entityTypes.iconColor
    ];
  return null;
}

export function typeToImage(type: string) {
  if (type in DEFINES.entityTypes.images)
    return DEFINES.entityTypes.images[
      type as keyof typeof DEFINES.entityTypes.images
    ];
  return DEFINES.entityTypes.images.default;
}

export function isLeftClick(event: MouseEvent | TouchEvent) {
  if (event instanceof MouseEvent) {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button === 0) return true;
  }
  return false;
}

export function storeInLocalStorage(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to store in localStorage:", error);
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue) as T;
    }
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
  }
  return defaultValue;
}
