import { createApiClient } from "@mediconnect/api-client";

/**
 * DrugBank API (commercial). Set DRUGBANK_API_KEY and optional DRUGBANK_BASE_URL.
 * @see https://go.drugbank.com/releases/latest
 */
export function createDrugBankClient() {
  const baseUrl = process.env.DRUGBANK_BASE_URL ?? "https://api.drugbank.com/v1";
  const client = createApiClient({
    baseUrl,
    getToken: async () => process.env.DRUGBANK_API_KEY,
  });

  return {
    async searchDrugs(query: string) {
      return client.get<unknown>(
        `/drugs?q=${encodeURIComponent(query)}`,
      );
    },
  };
}
