import { sendApiRequest } from "../utils/helpers.ts";

export const DataApi = {
  async getData() {
    const response = await sendApiRequest(`data`, {
      method: "GET",
      credentials: "include",
    });

    return await response.json();
  },
};

export default DataApi;
