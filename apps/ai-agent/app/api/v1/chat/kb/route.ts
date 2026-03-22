import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";
import {
  isLlmConfigured,
  runDoctorKbAssistantChat,
  type FeatherlessChatMessage,
} from "@mediconnect/knowledge-base";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_MESSAGES = 40;
const MAX_CONTENT = 12000;

function sanitizeClientMessages(raw: unknown): FeatherlessChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: FeatherlessChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: string }).role;
    const content = (m as { content?: string }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string" || !content.trim()) continue;
    const trimmed = content.trim().slice(0, MAX_CONTENT);
    out.push({ role, content: trimmed });
    if (out.length >= MAX_MESSAGES) break;
  }
  return out;
}

/**
 * Doctor / admin only: clinical assistant — hospital KB search, optional patient chart (care relationship), drug stub.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== Role.DOCTOR && user.role !== Role.ADMIN)) {
    return NextResponse.json(
      { error: "Forbidden", message: "This assistant is restricted to doctor and admin accounts." },
      { status: 403 },
    );
  }

  if (!isLlmConfigured()) {
    return NextResponse.json(
      { error: "LLM not configured", message: "Set LLM_BASE_URL and LLM_API_KEY (Featherless)." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => null)) as { messages?: unknown } | null;
  const userMessages = sanitizeClientMessages(body?.messages);
  if (userMessages.length === 0) {
    return NextResponse.json({ error: "messages required (user/assistant turns)" }, { status: 400 });
  }

  const doctorProfileId = user.doctor?.id ?? null;

  try {
    const { assistantMessage } = await runDoctorKbAssistantChat(prisma, userMessages, {
      role: user.role,
      doctorProfileId,
    });
    return NextResponse.json({ message: assistantMessage });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: "chat_failed", message }, { status: 502 });
  }
}
