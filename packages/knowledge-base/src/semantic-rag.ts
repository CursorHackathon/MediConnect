import type { PrismaClient } from "@prisma/client";

import { searchKnowledgeChunksByVector, type KnowledgeChunkVectorHit } from "@mediconnect/db";
import type { KnowledgeChunk } from "@mediconnect/types";

import { embedQueryText } from "./embeddings";
import { rankKnowledgeChunks } from "./rag";

function hitsToKnowledgeChunks(hits: KnowledgeChunkVectorHit[]): KnowledgeChunk[] {
  return hits.map(
    (h) =>
      ({
        id: h.id,
        source: h.source,
        content: h.content,
        embedding: null,
        metadata: h.metadata as KnowledgeChunk["metadata"],
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      }) satisfies KnowledgeChunk,
  );
}

/**
 * Vector search over hospital-upload chunks. Throws if the embedding service fails.
 */
export async function retrieveHospitalKnowledgeSemantic(
  prisma: PrismaClient,
  query: string,
  topK: number,
): Promise<KnowledgeChunkVectorHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const queryEmbedding = await embedQueryText(trimmed);
  return searchKnowledgeChunksByVector(prisma, {
    queryEmbedding,
    topK,
    filter: "hospital_upload",
  });
}

/** Options for patient-education vector retrieval (pgvector `<=>` cosine distance; lower = more similar). */
export type RetrievePatientEducationOptions = {
  /** Drop hits above this distance (weak / off-topic neighbors). Default 0.41. */
  maxDistance?: number;
  /** Rows to read from the DB before filtering (default max(topK * 5, 25)). */
  fetchK?: number;
};

/** Tuned so weak “nearest” chunks (often ~0.43–0.46 for unrelated queries) are not returned as matches. */
const DEFAULT_PATIENT_EDU_MAX_COSINE_DISTANCE = 0.41;

/**
 * Vector search over patient-facing education chunks (`metadata.audience === "patient"`).
 * Filters by cosine distance so unrelated top-k neighbors are not returned as if they matched.
 */
export async function retrievePatientEducationSemantic(
  prisma: PrismaClient,
  query: string,
  topK: number,
  options?: RetrievePatientEducationOptions,
): Promise<KnowledgeChunkVectorHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const queryEmbedding = await embedQueryText(trimmed);
  const fetchK = options?.fetchK ?? Math.max(topK * 5, 25);
  const maxDistance = options?.maxDistance ?? DEFAULT_PATIENT_EDU_MAX_COSINE_DISTANCE;

  const raw = await searchKnowledgeChunksByVector(prisma, {
    queryEmbedding,
    topK: fetchK,
    filter: "patient_audience",
  });

  const filtered = raw.filter((h) => h.distance <= maxDistance).slice(0, topK);

  // When the user relaxes maxDistance via env, unrelated queries can still yield a tight band of
  // mediocre scores (no clear winner). Treat that as “no confident match.”
  if (filtered.length >= 2) {
    const d0 = filtered[0]!.distance;
    const dLast = filtered[filtered.length - 1]!.distance;
    if (d0 > 0.38 && dLast - d0 < 0.03) {
      return [];
    }
  }

  return filtered;
}

/**
 * Prefer semantic retrieval; fall back to lexical ranking over recent hospital chunks when the embedding API fails or nothing is embedded yet.
 */
export async function retrieveHospitalKnowledgeWithFallback(
  prisma: PrismaClient,
  query: string,
  topK: number,
): Promise<{
  chunks: KnowledgeChunk[];
  mode: "semantic" | "lexical";
  /** Cosine distance per chunk (same order as chunks); lower is more similar. Only set for semantic mode. */
  distances?: number[];
}> {
  const trimmed = query.trim();
  if (!trimmed) return { chunks: [], mode: "lexical" };

  try {
    const hits = await retrieveHospitalKnowledgeSemantic(prisma, trimmed, topK);
    if (hits.length > 0) {
      return {
        chunks: hitsToKnowledgeChunks(hits),
        mode: "semantic",
        distances: hits.map((h) => h.distance),
      };
    }
  } catch {
    /* Embedding API missing or error — lexical fallback */
  }

  const rows = await prisma.knowledgeChunk.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  const hospital = rows.filter((r) => {
    const meta = r.metadata as Record<string, unknown> | null;
    return meta?.kind === "hospital_upload";
  });
  const ranked = rankKnowledgeChunks(
    trimmed,
    hospital.map(
      (h) =>
        ({
          id: h.id,
          source: h.source,
          content: h.content,
          embedding: h.embedding,
          metadata: h.metadata,
          createdAt: h.createdAt,
          updatedAt: h.updatedAt,
        }) satisfies KnowledgeChunk,
    ),
    topK,
  );
  return { chunks: ranked, mode: "lexical", distances: undefined };
}
