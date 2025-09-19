import { DEFINES } from "../defines.ts";

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

export function typeToString(type: string) {
  if (type in DEFINES.entityTypes.names)
    return DEFINES.entityTypes.names[
      type as keyof typeof DEFINES.entityTypes.names
    ];
  return DEFINES.entityTypes.names.default;
}

export function typeToColor(type: string) {
  if (type in DEFINES.entityTypes.colors)
    return DEFINES.entityTypes.colors[
      type as keyof typeof DEFINES.entityTypes.colors
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
