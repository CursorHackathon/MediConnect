import type { PrismaClient } from "@prisma/client";

/** Must match embedding model output and migration vector(1024). */
export const KNOWLEDGE_EMBEDDING_DIMENSIONS = 1024;

export function formatVectorLiteral(vector: number[]): string {
  const dim = KNOWLEDGE_EMBEDDING_DIMENSIONS;
  if (vector.length !== dim) {
    throw new Error(`Embedding must have ${dim} dimensions, got ${vector.length}`);
  }
  return `[${vector.join(",")}]`;
}

export async function setKnowledgeChunkEmbeddingVector(
  prisma: PrismaClient,
  chunkId: string,
  vector: number[],
): Promise<void> {
  const literal = formatVectorLiteral(vector);
  await prisma.$executeRawUnsafe(
    `UPDATE "KnowledgeChunk" SET "embeddingVector" = $1::vector, "updatedAt" = NOW() WHERE "id" = $2`,
    literal,
    chunkId,
  );
}

export type KnowledgeChunkVectorHit = {
  id: string;
  source: string;
  content: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  /** Cosine distance from pgvector `<=>` (lower is more similar for normalized vectors). */
  distance: number;
};

/** What to match in JSON metadata alongside vector similarity. */
export type KnowledgeVectorSearchFilter = "hospital_upload" | "patient_audience" | "all";

export async function searchKnowledgeChunksByVector(
  prisma: PrismaClient,
  params: {
    queryEmbedding: number[];
    topK: number;
    /** Default: hospital_upload. Use patient_audience for public / patient-education chunks. */
    filter?: KnowledgeVectorSearchFilter;
    /** @deprecated use filter: "all" instead */
    hospitalUploadOnly?: boolean;
  },
): Promise<KnowledgeChunkVectorHit[]> {
  const literal = formatVectorLiteral(params.queryEmbedding);
  const k = params.topK;

  const filter: KnowledgeVectorSearchFilter =
    params.filter ??
    (params.hospitalUploadOnly === false ? "all" : "hospital_upload");

  const metaClause =
    filter === "hospital_upload"
      ? `AND metadata->>'kind' = 'hospital_upload'`
      : filter === "patient_audience"
        ? `AND metadata->>'audience' = 'patient'`
        : "";

  if (filter !== "all") {
    const rows = await prisma.$queryRawUnsafe<
      {
        id: string;
        source: string;
        content: string;
        metadata: unknown;
        createdAt: Date;
        updatedAt: Date;
        distance: number;
      }[]
    >(
      `
      SELECT id, source, content, metadata, "createdAt", "updatedAt",
        ("embeddingVector" <=> $1::vector)::float8 AS distance
      FROM "KnowledgeChunk"
      WHERE "embeddingVector" IS NOT NULL
        ${metaClause}
      ORDER BY "embeddingVector" <=> $1::vector
      LIMIT $2
      `,
      literal,
      k,
    );
    return rows;
  }

  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      source: string;
      content: string;
      metadata: unknown;
      createdAt: Date;
      updatedAt: Date;
      distance: number;
    }[]
  >(
    `
    SELECT id, source, content, metadata, "createdAt", "updatedAt",
      ("embeddingVector" <=> $1::vector)::float8 AS distance
    FROM "KnowledgeChunk"
    WHERE "embeddingVector" IS NOT NULL
    ORDER BY "embeddingVector" <=> $1::vector
    LIMIT $2
    `,
    literal,
    k,
  );
  return rows;
}

export async function listKnowledgeChunkIdsWithoutEmbedding(
  prisma: PrismaClient,
  limit: number,
): Promise<{ id: string; content: string }[]> {
  return prisma.$queryRawUnsafe<{ id: string; content: string }[]>(
    `
    SELECT id, content
    FROM "KnowledgeChunk"
    WHERE "embeddingVector" IS NULL
    ORDER BY "createdAt" ASC
    LIMIT $1
    `,
    limit,
  );
}
