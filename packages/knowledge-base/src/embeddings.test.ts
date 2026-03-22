import { describe, expect, it } from "vitest";

import {
  DEFAULT_BGE_QUERY_PREFIX,
  hfFeatureExtractionToVector,
  l2Normalize,
} from "./embeddings";

describe("l2Normalize", () => {
  it("unit length for non-zero vectors", () => {
    const v = l2Normalize([3, 4]);
    const norm = Math.hypot(...v);
    expect(norm).toBeCloseTo(1, 6);
  });

  it("handles zero vector", () => {
    expect(l2Normalize([0, 0])).toEqual([0, 0]);
  });
});

describe("hfFeatureExtractionToVector", () => {
  it("accepts flat number[]", () => {
    expect(hfFeatureExtractionToVector([0.1, 0.2, 0.3])).toEqual([0.1, 0.2, 0.3]);
  });

  it("accepts single row number[][]", () => {
    expect(hfFeatureExtractionToVector([[0.1, 0.2]])).toEqual([0.1, 0.2]);
  });

  it("mean-pools multiple rows", () => {
    expect(hfFeatureExtractionToVector([[0, 2], [2, 0]])).toEqual([1, 1]);
  });
});

describe("DEFAULT_BGE_QUERY_PREFIX", () => {
  it("is non-empty for retrieval", () => {
    expect(DEFAULT_BGE_QUERY_PREFIX.length).toBeGreaterThan(0);
  });
});
