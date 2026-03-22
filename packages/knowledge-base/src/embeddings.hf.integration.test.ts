import { describe, expect, it } from "vitest";

import { embedDocumentTexts, embedQueryText, embedTextsHuggingFace } from "./embeddings";

function hasHfToken(): boolean {
  return Boolean(process.env.HF_TOKEN?.trim() || process.env.HUGGINGFACE_API_TOKEN?.trim());
}

function expectedDim(): number {
  const n = Number.parseInt(process.env.EMBEDDING_DIMENSIONS ?? "1024", 10);
  return Number.isFinite(n) && n > 0 ? n : 1024;
}

describe.skipIf(!hasHfToken())("Hugging Face embeddings (integration)", () => {
  it("embeds one document string (BGE passage-style)", async () => {
    const dim = expectedDim();
    const [vec] = await embedTextsHuggingFace(["Patient has Penicillin allergy and type 2 diabetes."]);
    expect(vec.length).toBe(dim);
    const norm = Math.hypot(...vec);
    expect(norm).toBeCloseTo(1, 5);
  });

  it("embedDocumentTexts matches single-string path", async () => {
    const dim = expectedDim();
    const [a] = await embedDocumentTexts(["Hospital protocol section A."]);
    const [b] = await embedTextsHuggingFace(["Hospital protocol section A."]);
    expect(a.length).toBe(dim);
    expect(b.length).toBe(dim);
    let dot = 0;
    for (let i = 0; i < dim; i++) dot += a[i]! * b[i]!;
    expect(dot).toBeCloseTo(1, 4);
  });

  it("embedQueryText applies BGE query prefix and returns normalized vector", async () => {
    const dim = expectedDim();
    const vec = await embedQueryText("post-operative fever management");
    expect(vec.length).toBe(dim);
    expect(Math.hypot(...vec)).toBeCloseTo(1, 5);
  });
});
