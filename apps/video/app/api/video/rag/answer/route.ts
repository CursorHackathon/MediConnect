import { NextResponse } from "next/server";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";
import {
  completeHospitalRagChat,
  isRagLlmConfigured,
  retrieveHospitalKnowledgeSemantic,
} from "@mediconnect/knowledge-base";

export const dynamic = "force-dynamic";

/** Doctor-only: grounded answer over hospital KB (MedGemma / OpenAI-compatible LLM). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { question?: string } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  let hits;
  try {
    hits = await retrieveHospitalKnowledgeSemantic(prisma, question, 5);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json(
      { error: "embedding_unavailable", message },
      { status: 503 },
    );
  }

  if (hits.length === 0) {
    return NextResponse.json({
      answer:
        "No embedded hospital documents matched this query. Ensure documents are uploaded in the admin knowledge base and Hugging Face embeddings are configured (HUGGINGFACE_API_TOKEN or HF_TOKEN).",
      citations: [] as { chunkId: string; source: string; excerpt: string }[],
    });
  }

  if (!isRagLlmConfigured()) {
    return NextResponse.json(
      {
        error: "llm_not_configured",
        message: "Set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL (Featherless, e.g. Qwen/Qwen3-14B).",
        citations: hits.map((h) => ({
          chunkId: h.id,
          source: h.source,
          excerpt: h.content.length > 400 ? `${h.content.slice(0, 400)}…` : h.content,
        })),
      },
      { status: 503 },
    );
  }

  try {
    const { answer, citations } = await completeHospitalRagChat(
      question,
      hits.map((h) => ({ id: h.id, source: h.source, content: h.content })),
    );
    return NextResponse.json({
      answer,
      citations,
      distances: hits.map((h) => h.distance),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: "llm_failed", message }, { status: 502 });
  }
}
