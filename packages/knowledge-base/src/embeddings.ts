import { InferenceClient } from "@huggingface/inference";

import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from "@mediconnect/db";

/** Default BAAI/bge-large-en-v1.5 asymmetric retrieval prefix (model card). */
export const DEFAULT_BGE_QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

export function l2Normalize(vector: number[]): number[] {
  let sumSq = 0;
  for (const x of vector) sumSq += x * x;
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return [...vector];
  return vector.map((x) => x / norm);
}

function expectedDimensions(): number {
  const raw = process.env.EMBEDDING_DIMENSIONS;
  if (raw === undefined || raw === "") return KNOWLEDGE_EMBEDDING_DIMENSIONS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return KNOWLEDGE_EMBEDDING_DIMENSIONS;
  return n;
}

function assertDimension(vec: number[], context: string) {
  const dim = expectedDimensions();
  if (vec.length !== dim) {
    throw new Error(`${context}: expected ${dim}-dim embedding, got ${vec.length}`);
  }
}

function meanPool(rows: number[][]): number[] {
  if (rows.length === 0) return [];
  const dim = rows[0]!.length;
  const acc = new Array(dim).fill(0);
  for (const row of rows) {
    for (let i = 0; i < dim; i++) acc[i] += row[i]!;
  }
  for (let i = 0; i < dim; i++) acc[i] /= rows.length;
  return acc;
}

/** Normalize HF `feature-extraction` payloads (pooled vector, single row, or token matrix). */
export function hfFeatureExtractionToVector(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Hugging Face feature-extraction: empty or invalid response");
  }
  if (typeof raw[0] === "number") {
    return raw as number[];
  }
  const rows = raw as number[][];
  if (!Array.isArray(rows[0])) {
    throw new Error("Hugging Face feature-extraction: unexpected nested shape");
  }
  if (typeof rows[0]![0] === "number") {
    if (rows.length === 1) return rows[0]!;
    return meanPool(rows);
  }
  const flat: number[][] = [];
  for (const item of rows) {
    if (Array.isArray(item) && item.length > 0 && Array.isArray(item[0])) {
      flat.push(...(item as unknown as number[][]));
    }
  }
  if (flat.length === 0) {
    throw new Error("Hugging Face feature-extraction: could not flatten token embeddings");
  }
  return meanPool(flat);
}

function huggingFaceToken(): string {
  return (
    process.env.HUGGINGFACE_API_TOKEN?.trim() ||
    process.env.HF_TOKEN?.trim() ||
    ""
  );
}

function huggingFaceEmbeddingModel(): string {
  return (process.env.HF_EMBEDDING_MODEL ?? "BAAI/bge-large-en-v1.5").trim();
}

function inferenceClient(): InferenceClient {
  const token = huggingFaceToken();
  if (!token) {
    throw new Error("Set HUGGINGFACE_API_TOKEN or HF_TOKEN for embeddings (Hugging Face Inference API).");
  }
  return new InferenceClient(token);
}

/**
 * Hugging Face Inference API — `feature-extraction` on router (`hf-inference`), same path as:
 * `https://router.huggingface.co/hf-inference/models/<model>/pipeline/feature-extraction`
 */
export async function embedTextsHuggingFace(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const client = inferenceClient();
  const model = huggingFaceEmbeddingModel();
  const out: number[][] = [];

  for (const text of texts) {
    const raw = await client.featureExtraction({
      model,
      inputs: text,
      provider: "hf-inference",
    });
    const vec = l2Normalize(hfFeatureExtractionToVector(raw));
    assertDimension(vec, "embedTextsHuggingFace");
    out.push(vec);
  }
  return out;
}

/** Hospital KB chunks: plain text (BGE passage side; no query prefix). */
export async function embedDocumentTexts(texts: string[]): Promise<number[][]> {
  return embedTextsHuggingFace(texts);
}

/** Search query with BGE retrieval prefix. */
export async function embedQueryText(query: string): Promise<number[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("embedQueryText: empty query");
  }
  const custom = process.env.BGE_QUERY_PREFIX;
  const prefix = custom !== undefined ? custom : DEFAULT_BGE_QUERY_PREFIX;
  const text = prefix.trim() === "" ? trimmed : `${prefix}${trimmed}`;
  const [vec] = await embedTextsHuggingFace([text]);
  return vec!;
}
