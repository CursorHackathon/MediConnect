import { NextResponse } from "next/server";

import { rankKnowledgeChunks } from "@mediconnect/knowledge-base";
import type { KnowledgeChunk } from "@mediconnect/types";

export const dynamic = "force-dynamic";

/** Demo endpoint: rank static chunks (replace with DB + embeddings in production). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query ?? "";
  const demo: KnowledgeChunk[] = [
    {
      id: "1",
      source: "demo",
      content: "Hypertension management in primary care.",
      embedding: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      source: "demo",
      content: "Vaccination schedule for adults in Germany.",
      embedding: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  const ranked = rankKnowledgeChunks(query, demo, 3);
  return NextResponse.json({ query, ranked });
}
