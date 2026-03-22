import { fileURLToPath } from "node:url";

import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  inference,
  voice,
} from "@livekit/agents";
import * as bey from "@livekit/agents-plugin-bey";
import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as openai from "@livekit/agents-plugin-openai";
import * as silero from "@livekit/agents-plugin-silero";
import * as KbStar from "@mediconnect/knowledge-base";
import dotenv from "dotenv";

import { PatientVoiceAgent } from "./agent";
import { unwrapDefaultModule } from "./workspace-interop";

const KB = unwrapDefaultModule(KbStar as Record<string, unknown>);
const getLlmConfig = KB.getLlmConfig as typeof import("@mediconnect/knowledge-base").getLlmConfig;
const isRagLlmConfigured = KB.isRagLlmConfigured as typeof import("@mediconnect/knowledge-base").isRagLlmConfigured;

dotenv.config({ path: "../../.env" });

const llmCfg = getLlmConfig();
if (!isRagLlmConfigured()) {
  console.warn("[mediconnect-patient-voice] LLM_BASE_URL / LLM_API_KEY not fully set — replies may fail.");
}
if (!process.env.ELEVENLABS_API_KEY?.trim() || !process.env.ELEVENLABS_VOICE_ID?.trim()) {
  console.warn("[mediconnect-patient-voice] ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID not set — TTS may fail.");
}

const beyApiKey = process.env.BEYOND_PRESENCE_API_KEY ?? process.env.BEY_API_KEY;
const beyAvatarId = process.env.BEYOND_PRESENCE_AVATAR_ID;
if (!beyApiKey || !beyAvatarId) {
  console.warn(
    "[mediconnect-patient-voice] BEYOND_PRESENCE_API_KEY / BEYOND_PRESENCE_AVATAR_ID not set — avatar will not start.",
  );
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() ?? "";
    const session = new voice.AgentSession({
      stt: new inference.STT({
        model: "deepgram/nova-3",
        language: "multi",
      }),
      llm: new openai.LLM({
        model: llmCfg.model,
        apiKey: llmCfg.apiKey,
        baseURL: llmCfg.baseUrl,
      }),
      tts: new elevenlabs.TTS({
        apiKey: process.env.ELEVENLABS_API_KEY,
        voiceId,
      }),
      turnDetection: new livekit.turnDetector.MultilingualModel(),
      vad: ctx.proc.userData.vad! as silero.VAD,
      voiceOptions: {
        preemptiveGeneration: true,
      },
    });

    await ctx.connect();

    if (beyApiKey && beyAvatarId) {
      try {
        const avatar = new bey.AvatarSession({
          avatarId: beyAvatarId,
          apiKey: beyApiKey,
          apiUrl: process.env.BEYOND_PRESENCE_API_URL,
        });
        await avatar.start(session, ctx.room);
      } catch (avatarErr) {
        console.error("[mediconnect-patient-voice] Beyond Presence avatar failed to start:", avatarErr);
      }
    }

    const useAvatar = !!(beyApiKey && beyAvatarId);
    await session.start({
      agent: new PatientVoiceAgent(),
      room: ctx.room,
      inputOptions: {},
      outputOptions: useAvatar ? { audioEnabled: false } : {},
    });

    session.generateReply({
      instructions:
        "Greet the patient briefly in one short sentence and offer to answer general health education questions.",
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: "mediconnect-patient-voice",
  }),
);
