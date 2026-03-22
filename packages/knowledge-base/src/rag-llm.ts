import { getLlmConfig, isLlmConfigured } from "./llm-config";

export type RagContextChunk = {
  id: string;
  source: string;
  content: string;
};

export type RagLlmResult = {
  answer: string;
  citations: { chunkId: string; source: string; excerpt: string }[];
};

export function isRagLlmConfigured(): boolean {
  return isLlmConfigured();
}

/**
 * OpenAI-compatible chat completions (Featherless, OpenAI, vLLM, etc.).
 */
export async function completeHospitalRagChat(
  question: string,
  contextChunks: RagContextChunk[],
): Promise<RagLlmResult> {
  const { baseUrl, apiKey, model } = getLlmConfig();
  if (!baseUrl || !apiKey) {
    throw new Error("LLM_BASE_URL and LLM_API_KEY must be set for RAG answers");
  }

  const contextText = contextChunks
    .map((c, i) => `[[${i + 1}] ${c.source}]\n${c.content}`)
    .join("\n\n---\n\n");

  const system = `You are a clinical support assistant. Answer using ONLY the provided context passages. If the context is insufficient, say so clearly. Do not invent facts or citations beyond the numbered passages. Respond in clear English. This is decision support only—not a substitute for professional medical judgment.`;

  const user = `Context:\n${contextText}\n\nQuestion: ${question.trim()}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM API ${res.status}: ${t.slice(0, 400)}`);
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const answer = body.choices?.[0]?.message?.content?.trim() ?? "";

  const citations = contextChunks.map((c) => ({
    chunkId: c.id,
    source: c.source,
    excerpt: c.content.length > 400 ? `${c.content.slice(0, 400)}…` : c.content,
  }));

  return { answer, citations };
}

/**
 * Patient-education RAG (same OpenAI-compatible host as hospital RAG; different safety/system tone).
 */
export async function completePatientEducationRagChat(
  question: string,
  contextChunks: RagContextChunk[],
): Promise<RagLlmResult> {
  const { baseUrl, apiKey, model } = getLlmConfig();
  if (!baseUrl || !apiKey) {
    throw new Error("LLM_BASE_URL and LLM_API_KEY must be set for RAG answers");
  }

  const contextText = contextChunks
    .map((c, i) => `[[${i + 1}] ${c.source}]\n${c.content}`)
    .join("\n\n---\n\n");

  const system = `You are a calm, friendly health information assistant for the public during a video visit.
Answer using ONLY the numbered passages. Use short, plain sentences suitable for spoken replies — no lists, markdown, or symbols.
If the passages are not enough, say so and suggest speaking with a clinician or official health sources.
Never diagnose, prescribe, or give personal medical orders. For emergencies, tell them to contact emergency services immediately.`;

  const user = `Context:\n${contextText}\n\nQuestion: ${question.trim()}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM API ${res.status}: ${t.slice(0, 400)}`);
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const answer = body.choices?.[0]?.message?.content?.trim() ?? "";

  const citations = contextChunks.map((c) => ({
    chunkId: c.id,
    source: c.source,
    excerpt: c.content.length > 400 ? `${c.content.slice(0, 400)}…` : c.content,
  }));

  return { answer, citations };
}
