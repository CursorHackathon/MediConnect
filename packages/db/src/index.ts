import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function databaseUrl(): string {
  // Bracket access + explicit datasource reduces risk of a wrong URL baked in at Next build time.
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
export {
  formatVectorLiteral,
  KNOWLEDGE_EMBEDDING_DIMENSIONS,
  listKnowledgeChunkIdsWithoutEmbedding,
  searchKnowledgeChunksByVector,
  setKnowledgeChunkEmbeddingVector,
  type KnowledgeChunkVectorHit,
  type KnowledgeVectorSearchFilter,
} from "./knowledge-vector";
