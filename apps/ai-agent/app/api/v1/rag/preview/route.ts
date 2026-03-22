import { NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";
import { retrieveHospitalKnowledgeWithFallback } from "@mediconnect/knowledge-base";

export const dynamic = "force-dynamic";

/** Dev/demo: semantic retrieval with lexical fallback (same pipeline as apps/video knowledge-preview). */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query ?? "";

  const { chunks, mode, distances } = await retrieveHospitalKnowledgeWithFallback(prisma, query, 5);

  return NextResponse.json({
    query,
    mode,
    ranked: chunks.map((c, i) => ({
      id: c.id,
      source: c.source,
      content: c.content.slice(0, 800),
      score:
        mode === "semantic" && distances && distances[i] !== undefined
          ? Math.max(0, 1 - distances[i]!)
          : undefined,
    })),
  });
}
