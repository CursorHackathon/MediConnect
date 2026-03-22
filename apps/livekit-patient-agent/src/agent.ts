import type { PrismaClient } from "@prisma/client";
import * as DbStar from "@mediconnect/db";
import * as KbStar from "@mediconnect/knowledge-base";
import type { RetrievePatientEducationOptions } from "@mediconnect/knowledge-base";
import { llm, voice } from "@livekit/agents";
import { z } from "zod";

import { unwrapDefaultModule } from "./workspace-interop";

const Db = unwrapDefaultModule(DbStar as Record<string, unknown>);
const KB = unwrapDefaultModule(KbStar as Record<string, unknown>);
const prisma = Db.prisma as PrismaClient;
const retrievePatientEducationSemantic = KB.retrievePatientEducationSemantic as typeof import("@mediconnect/knowledge-base").retrievePatientEducationSemantic;

function patientEducationRetrieveOptions(): RetrievePatientEducationOptions | undefined {
  const raw = process.env.PATIENT_EDUCATION_MAX_COSINE_DISTANCE?.trim();
  if (!raw) return undefined;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? { maxDistance: n } : undefined;
}

export class PatientVoiceAgent extends voice.Agent {
  constructor() {
    super({
      instructions: `You are a patient-friendly health education assistant in a live video visit.
The user speaks to you by voice. Reply in short, natural sentences suitable for text-to-speech — no markdown, bullets, emojis, or asterisks.
Use the search_patient_education tool before stating factual health information from our knowledge base.
If the tool finds no matching passages, or the passages are clearly about a different topic than the user's question, say you do not have verified material on that specific topic and suggest they ask their clinician. Do not present unrelated passages as answers.
Never diagnose or prescribe. For emergencies, tell them to contact emergency services immediately.`,

      tools: {
        search_patient_education: llm.tool({
          description:
            "Search vetted patient-education passages (symptoms, medications, self-care). Use for factual health questions before answering.",
          parameters: z.object({
            query: z.string().describe("Keywords or question to search the patient education library"),
          }),
          execute: async ({ query }) => {
            try {
              const hits = await retrievePatientEducationSemantic(prisma, query, 5, patientEducationRetrieveOptions());
              if (hits.length === 0) {
                return "No matching passages in the patient education library.";
              }
              const result = hits
                .map((h, i) => {
                  const excerpt = h.content.length > 1200 ? `${h.content.slice(0, 1200)}…` : h.content;
                  return `[${i + 1}] source: ${h.source}\n${excerpt}`;
                })
                .join("\n\n---\n\n");
              return result;
            } catch (e) {
              const msg = e instanceof Error ? e.message : "unknown error";
              return `Search failed: ${msg}. Ensure DATABASE_URL and embedding (HF_TOKEN) are configured.`;
            }
          },
        }),
      },
    });
  }
}
