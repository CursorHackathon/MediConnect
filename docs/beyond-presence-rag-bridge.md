# Beyond Presence and hospital RAG

## Patient voice → avatar pipeline (LiveKit agent)

End-to-end flow:

1. **Patient** speaks in the LiveKit client (mic only — no camera). The UI is `@livekit/components-react` in [`/patient/ai-avatar`](../apps/video/app/patient/ai-avatar/page.tsx).
2. **LiveKit** carries audio; **LiveKit Inference STT** (Deepgram via your LiveKit project) transcribes speech in [`apps/livekit-patient-agent`](../apps/livekit-patient-agent).
3. **Featherless** (OpenAI-compatible `LLM_*`) reasons over the conversation; **patient KB** is retrieved with `retrievePatientEducationSemantic` through the `search_patient_education` tool (pgvector + `HF_TOKEN` embeddings).
4. **ElevenLabs** (`ELEVENLABS_*`) synthesizes the reply; the agent publishes **audio** into the **same** LiveKit room.
5. **Beyond Presence** (`@livekit/agents-plugin-bey`) runs inside the agent. The plugin calls the BP session API, routes the agent's TTS audio to the avatar, and publishes lip-synced video back into the room — keeping audio and video in sync.

**Room naming:** [`apps/video/lib/livekit-room.ts`](../apps/video/lib/livekit-room.ts) — `livekitRoomNameForAiSession(sessionId)` for **patient ↔ AI** sessions (`mc-ai-…`), and `livekitRoomNameForAppointment(appointmentId)` for legacy doctor-appointment rooms. The video app dispatches **`mediconnect-patient-voice`** when the patient starts an AI session via [`POST /api/video/patient/ai-avatar/start`](../apps/video/app/api/video/patient/ai-avatar/start/route.ts); the agent creates the BP avatar session internally. Doctor appointment start **does not** dispatch the voice agent.

**Run the worker:** First-time setup downloads LiveKit turn-detector ONNX files: `pnpm --filter @mediconnect/livekit-patient-agent download-files`. Then `pnpm --filter @mediconnect/livekit-patient-agent dev` (or `pnpm livekit:patient-agent` from the repo root). Requires `LIVEKIT_*` credentials, `BEYOND_PRESENCE_API_KEY`, `BEYOND_PRESENCE_AVATAR_ID`, `ELEVENLABS_API_KEY`, and `ELEVENLABS_VOICE_ID`.

**Note:** ElevenLabs' LiveKit plugin is **TTS** only; "hearing" the patient uses LiveKit's **STT** path (Deepgram) above.

## Current integration (video)

**Patient AI avatar:** [`POST /api/video/patient/ai-avatar/start`](../apps/video/app/api/video/patient/ai-avatar/start/route.ts) creates a LiveKit room, dispatches the voice agent, and returns a patient JWT. The agent handles BP via `@livekit/agents-plugin-bey` — the video app no longer calls the BP REST API for AI sessions. The frontend renders only the avatar's video track (participant identity `bey-avatar-agent`).

**Doctor appointments (legacy):** [`apps/video/lib/beyond-presence-room.ts`](../apps/video/lib/beyond-presence-room.ts) still calls `POST /v1/sessions` directly for `createVideoRoom`. This path does not dispatch the voice agent.

## MediConnect-side RAG (implemented)

Grounded answers use **MediConnect APIs**, not the Beyond Presence REST body:

- **Embeddings:** **Hugging Face Inference API** — `feature-extraction` / `BAAI/bge-large-en-v1.5` via `@huggingface/inference` (`HUGGINGFACE_API_TOKEN` or `HF_TOKEN`).
- **Storage:** Postgres + pgvector column `KnowledgeChunk.embeddingVector` (1024 dimensions).
- **Generation:** OpenAI-compatible `POST /v1/chat/completions` (Featherless; default `Qwen/Qwen3-14B`) via `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`.
- **Doctor UI:** Video app sidebar — **KB (AI)** calls `POST /api/video/rag/answer` (doctor session required).

This path keeps RAG under your control (logging, PHI policy, model choice) independent of the avatar transport.

## Branch A — vendor KB on the session (future)

If Beyond Presence (or your Pipecat/LiveKit agent) documents a way to attach **static context**, **tool URLs**, or **per-session instructions**, extend the session `POST` (or follow-up API) to:

- inject a short **hospital policy summary**, and/or
- register a **tool** that calls MediConnect `rag/answer` or retrieval-only endpoints.

Re-read the vendor's latest API reference before implementing; field names differ by product version.

## Branch B — avatar video only (default until A is confirmed)

Beyond Presence continues to handle **audio/video**. Clinical lookup stays in the **sidebar** (search + KB AI) or a separate client channel. Optionally forward **LiveKit data messages** from a custom agent to the same RAG routes if you add a Pipecat worker later.

## Safety

Do not log raw prompts or answers if they may contain **PHI**. Review Featherless (or any LLM host) **data processing terms** before production use with real patient content.
