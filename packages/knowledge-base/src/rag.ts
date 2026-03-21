import type { KnowledgeChunk } from "@mediconnect/types";

export type RagChunkInput = Pick<KnowledgeChunk, "source" | "content"> & {
  metadata?: Record<string, unknown>;
};

/** Normalize text for retrieval (lowercase, collapse whitespace). */
export function normalizeChunkText(text: string) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Simple lexical overlap score for development; swap with embeddings in production. */
export function scoreChunkRelevance(query: string, chunkContent: string) {
  const q = new Set(normalizeChunkText(query).split(" ").filter(Boolean));
  const c = normalizeChunkText(chunkContent);
  let hits = 0;
  for (const word of q) {
    if (c.includes(word)) hits += 1;
  }
  return q.size ? hits / q.size : 0;
}

export function rankKnowledgeChunks(query: string, chunks: KnowledgeChunk[], topK = 5) {
  return [...chunks]
    .map((chunk) => ({
      chunk,
      score: scoreChunkRelevance(query, chunk.content),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.chunk);
}
