import { NextResponse } from "next/server";

import { requireRole } from "@mediconnect/auth";
import { listKnowledgeChunkIdsWithoutEmbedding, prisma, setKnowledgeChunkEmbeddingVector } from "@mediconnect/db";
import { embedDocumentTexts } from "@mediconnect/knowledge-base";
import { Role } from "@prisma/client";

const DEFAULT_LIMIT = 32;

/**
 * Admin-only: embed chunks that have no pgvector row yet (e.g. uploaded before embeddings were configured).
 */
export async function POST(req: Request) {
  const denied = await requireRole(Role.ADMIN);
  if (denied) return denied;

  let limit = DEFAULT_LIMIT;
  try {
    const body = (await req.json().catch(() => null)) as { limit?: number } | null;
    if (body?.limit !== undefined && Number.isFinite(body.limit)) {
      limit = Math.min(128, Math.max(1, Math.floor(body.limit)));
    }
  } catch {
    /* use default */
  }

  const pending = await listKnowledgeChunkIdsWithoutEmbedding(prisma, limit);
  if (pending.length === 0) {
    return NextResponse.json({ updated: 0, message: "nothing to backfill" });
  }

  let embeddings: number[][];
  try {
    embeddings = await embedDocumentTexts(pending.map((p) => p.content));
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: "embedding_failed", message }, { status: 502 });
  }

  for (let i = 0; i < pending.length; i++) {
    const row = pending[i]!;
    const vec = embeddings[i]!;
    await setKnowledgeChunkEmbeddingVector(prisma, row.id, vec);
  }

  return NextResponse.json({ updated: pending.length });
}
