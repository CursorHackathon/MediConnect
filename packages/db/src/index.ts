import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

/** Lazily initialised so `import { prisma }` during `next build` page-data collection doesn't throw when DATABASE_URL is unavailable. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma._prisma) {
      globalForPrisma._prisma = createPrismaClient();
    }
    const value = globalForPrisma._prisma[prop as keyof PrismaClient];
    return typeof value === "function" ? value.bind(globalForPrisma._prisma) : value;
  },
});

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
