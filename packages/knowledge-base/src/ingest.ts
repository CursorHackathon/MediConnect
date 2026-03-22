const DEFAULT_WORDS_PER_CHUNK = 120;
const DEFAULT_OVERLAP = 20;

/**
 * Split plain text into overlapping word windows (~500-token chunks at ~4 chars/token).
 */
export function splitTextIntoChunks(
  text: string,
  wordsPerChunk = DEFAULT_WORDS_PER_CHUNK,
  overlapWords = DEFAULT_OVERLAP,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + wordsPerChunk, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end >= words.length) break;
    start = Math.max(0, end - overlapWords);
  }
  return chunks;
}
