import { createApiClient } from "@mediconnect/api-client";

const icdBase = "https://id.who.int/icd";

export type Icd10SearchResult = {
  id?: string;
  title?: string;
  code?: string;
};

/**
 * WHO ICD-API client (OAuth required for production). Configure ICD_CLIENT_ID / ICD_CLIENT_SECRET.
 * @see https://icd.who.int/icdapi
 */
export function createIcd10Client() {
  const client = createApiClient({
    baseUrl: icdBase,
    getToken: async () => process.env.ICD_API_TOKEN,
  });

  return {
    async searchLinearization(query: string, linearization = "mms") {
      const q = encodeURIComponent(query);
      return client.get<{ destinationEntities?: Icd10SearchResult[] }>(
        `/entity/search?q=${q}&linearization=${linearization}`,
      );
    },
  };
}
