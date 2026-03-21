import { createApiClient } from "@mediconnect/api-client";

const eutils = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export type PubMedSearchResponse = {
  esearchresult?: {
    idlist?: string[];
    count?: string;
  };
};

export type PubMedSummaryResponse = {
  result?: Record<
    string,
    {
      title?: string;
      authors?: { name?: string }[];
      source?: string;
      pubdate?: string;
    }
  >;
};

/** NCBI E-utilities PubMed client. Set NCBI_API_KEY for higher rate limits. */
export function createPubMedClient() {
  const apiKey = process.env.NCBI_API_KEY;
  const client = createApiClient({ baseUrl: eutils });

  return {
    async search(term: string, retmax = "10") {
      const key = apiKey ? `&api_key=${apiKey}` : "";
      return client.get<PubMedSearchResponse>(
        `/esearch.fcgi?db=pubmed&retmode=json&retmax=${retmax}&term=${encodeURIComponent(term)}${key}`,
      );
    },
    async summary(ids: string[]) {
      if (ids.length === 0) {
        return { result: {} } as PubMedSummaryResponse;
      }
      const key = apiKey ? `&api_key=${apiKey}` : "";
      const id = ids.join(",");
      return client.get<PubMedSummaryResponse>(
        `/esummary.fcgi?db=pubmed&retmode=json&id=${id}${key}`,
      );
    },
  };
}
