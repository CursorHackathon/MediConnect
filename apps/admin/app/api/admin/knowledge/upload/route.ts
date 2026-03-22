import { NextResponse } from "next/server";

import { requireRole } from "@mediconnect/auth";
import { prisma, setKnowledgeChunkEmbeddingVector } from "@mediconnect/db";
import { embedDocumentTexts, splitTextIntoChunks } from "@mediconnect/knowledge-base";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  const denied = await requireRole(Role.ADMIN);
  if (denied) return denied;

  const body = (await req.json()) as { title?: string; content?: string };
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Krankenhausdokument";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const parts = splitTextIntoChunks(content);
  const hospitalIdPlaceholder = "default";

  let embeddings: number[][];
  try {
    embeddings = await embedDocumentTexts(parts);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: "embedding_failed", message }, { status: 502 });
  }

  const rows = await prisma.$transaction(
    parts.map((chunk, i) =>
      prisma.knowledgeChunk.create({
        data: {
          source: `${title} · Abschnitt ${i + 1}/${parts.length}`,
          content: chunk,
          metadata: {
            kind: "hospital_upload",
            title,
            chunkIndex: i,
            hospitalId: hospitalIdPlaceholder,
          },
        },
      }),
    ),
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const vec = embeddings[i]!;
    await setKnowledgeChunkEmbeddingVector(prisma, row.id, vec);
  }

  return NextResponse.json({ created: parts.length });
}
