/** Featherless / OpenAI-compatible chat (env: LLM_*). */
export function getLlmConfig() {
  const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.featherless.ai/v1").replace(/\/$/, "");
  const apiKey = process.env.LLM_API_KEY ?? "";
  const model = process.env.LLM_MODEL ?? "Qwen/Qwen3-14B";
  return { baseUrl, apiKey, model };
}

export function isLlmConfigured(): boolean {
  const { baseUrl, apiKey } = getLlmConfig();
  return Boolean(baseUrl && apiKey);
}
