import type { PrismaClient, Role } from "@prisma/client";

import {
  DRUG_INTERACTION_TOOL,
  featherlessChatCompletions,
  type FeatherlessChatMessage,
  HOSPITAL_KB_TOOL,
  PATIENT_CHART_TOOL,
  PATIENT_KB_TOOL,
} from "./featherless-chat";
import { retrieveHospitalKnowledgeSemantic, retrievePatientEducationSemantic } from "./semantic-rag";

const DEFAULT_SYSTEM = `You are a friendly, calm health assistant speaking to a member of the public.
Use simple everyday language. Never use medical jargon without explaining it.
Always recommend the patient see a real doctor for diagnosis.
If there is any sign of emergency, immediately tell them to call emergency services.
Only use documents tagged audience:patient in your knowledge base — use the search_patient_knowledge tool to retrieve them before answering factual health questions.
If the tool returns no relevant passage, say you do not have verified material on that topic and suggest they speak with a clinician or official health sources.
Never claim to diagnose or prescribe.`;

const KB_TOOLS = [PATIENT_KB_TOOL, DRUG_INTERACTION_TOOL];

function withDefaultSystem(messages: FeatherlessChatMessage[]): FeatherlessChatMessage[] {
  if (messages.length > 0 && messages[0]!.role === "system") {
    return messages;
  }
  return [{ role: "system", content: DEFAULT_SYSTEM }, ...messages];
}

function formatPatientHitContent(
  hits: Awaited<ReturnType<typeof retrievePatientEducationSemantic>>,
): string {
  return hits
    .map((h, i) => {
      const meta = h.metadata as Record<string, unknown> | null;
      const title = typeof meta?.title === "string" ? meta.title : h.source;
      const source = typeof meta?.source === "string" ? meta.source : "";
      const url = typeof meta?.url === "string" ? `\nurl: ${meta.url}` : "";
      const lang = typeof meta?.language === "string" ? `\nlanguage: ${meta.language}` : "";
      const body = h.content.slice(0, 1500) + (h.content.length > 1500 ? "…" : "");
      return `[${i + 1}] ${title}${source ? ` (${source})` : ""}${url}${lang}\n${body}`;
    })
    .join("\n\n---\n\n");
}

async function executeToolCall(
  prisma: PrismaClient,
  name: string,
  argsJson: string,
): Promise<string> {
  try {
    if (name === "search_patient_knowledge") {
      const { query } = JSON.parse(argsJson) as { query?: string };
      const q = typeof query === "string" ? query.trim() : "";
      if (!q) return "No query provided.";
      try {
        const hits = await retrievePatientEducationSemantic(prisma, q, 6);
        if (hits.length === 0) {
          return "No matching passages in the patient education knowledge base. Try different keywords or broader terms.";
        }
        return formatPatientHitContent(hits);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "embedding error";
        return `Knowledge search failed (${msg}). Ensure HF_TOKEN is set and patient education chunks are embedded (run pnpm seed-patient-education from @mediconnect/knowledge-base).`;
      }
    }
    if (name === "check_drug_interaction") {
      const { drugs } = JSON.parse(argsJson) as { drugs?: string[] };
      return JSON.stringify({
        notice:
          "Demo mode: no live drug–drug interaction API is connected. Use search_patient_knowledge for patient medication education passages, or consult a licensed drug information resource / clinical decision support.",
        drugs: Array.isArray(drugs) ? drugs : [],
      });
    }
    return JSON.stringify({ error: `Unknown tool: ${name}` });
  } catch {
    return JSON.stringify({ error: "Invalid tool arguments" });
  }
}

const MAX_TOOL_ROUNDS = 4;

const DOCTOR_SYSTEM = `You are a clinical assistant for licensed hospital clinicians (doctors and admins).
Use professional medical language appropriate for providers. Do not address the user as a patient.
Capabilities:
- search_hospital_knowledge: internal hospital documents, protocols, and uploaded KB (use for policies, pathways, quick document research).
- get_patient_clinical_summary: structured chart excerpt when the user supplies the patient's login email; only returns data when care relationship rules are satisfied.
- check_drug_interaction: demo stub only — remind users to verify in approved drug information systems.
For disease or condition questions, prefer hospital KB search first, then synthesize with standard clinical caveats.
Never fabricate patient-specific facts; only use tool output for chart data.
Remind users that this is decision support, not a substitute for full chart review or institutional policy.`;

const DOCTOR_KB_TOOLS = [HOSPITAL_KB_TOOL, PATIENT_CHART_TOOL, DRUG_INTERACTION_TOOL];

export type DoctorKbChatContext = {
  role: Role;
  /** Set when the signed-in user has a Doctor row (Prisma Doctor.id). */
  doctorProfileId: string | null;
};

function withDoctorSystem(messages: FeatherlessChatMessage[]): FeatherlessChatMessage[] {
  if (messages.length > 0 && messages[0]!.role === "system") {
    return messages;
  }
  return [{ role: "system", content: DOCTOR_SYSTEM }, ...messages];
}

function formatHospitalHitContent(
  hits: Awaited<ReturnType<typeof retrieveHospitalKnowledgeSemantic>>,
): string {
  if (hits.length === 0) {
    return "No matching passages in the hospital knowledge base. Upload/embed documents in admin or try different keywords.";
  }
  return hits
    .map((h, i) => {
      const meta = h.metadata as Record<string, unknown> | null;
      const title = typeof meta?.title === "string" ? meta.title : h.source;
      const body = h.content.slice(0, 2000) + (h.content.length > 2000 ? "…" : "");
      return `[${i + 1}] ${title} (source: ${h.source}, distance=${h.distance.toFixed(4)})\n${body}`;
    })
    .join("\n\n---\n\n");
}

async function formatPatientClinicalSummary(
  prisma: PrismaClient,
  ctx: DoctorKbChatContext,
  patientEmail: string,
): Promise<string> {
  const email = patientEmail.trim().toLowerCase();
  if (!email) return "Provide patientEmail.";

  const userRecord = await prisma.user.findUnique({
    where: { email },
    include: {
      patient: {
        include: {
          medicalHistories: { orderBy: { updatedAt: "desc" }, take: 25 },
          medications: {
            orderBy: { updatedAt: "desc" },
            take: 40,
            include: {
              prescribedBy: { include: { user: { select: { name: true } } } },
            },
          },
          vaccinations: { orderBy: { updatedAt: "desc" }, take: 20 },
        },
      },
    },
  });

  if (!userRecord || userRecord.role !== "PATIENT" || !userRecord.patient) {
    return `No patient user with email ${email}.`;
  }

  const patientId = userRecord.patient.id;

  if (ctx.role === "DOCTOR") {
    if (!ctx.doctorProfileId) {
      return "Your account is marked as doctor but has no doctor profile linked; cannot load charts.";
    }
    const apptCount = await prisma.appointment.count({
      where: { patientId, doctorId: ctx.doctorProfileId },
    });
    if (apptCount === 0) {
      return "No appointments on file between you and this patient. Chart summary is not shown (establish care relationship in scheduling first).";
    }
  } else if (ctx.role !== "ADMIN") {
    return "Not authorized for clinical chart lookup.";
  }

  const p = userRecord.patient;
  const allergiesRaw = p.allergies;
  const allergies =
    Array.isArray(allergiesRaw) && allergiesRaw.every((x) => typeof x === "string")
      ? (allergiesRaw as string[]).join(", ")
      : allergiesRaw
        ? JSON.stringify(allergiesRaw)
        : "none recorded";

  const lines: string[] = [];
  lines.push(`### Demographics`);
  lines.push(`- Name: ${userRecord.name ?? "—"}`);
  lines.push(`- Email: ${email}`);
  lines.push(`- DOB: ${p.dob ? p.dob.toISOString().slice(0, 10) : "—"}`);
  lines.push(`- Phone: ${p.phone ?? "—"}`);
  lines.push(`- Allergies: ${allergies || "none recorded"}`);

  lines.push(`\n### Conditions (MedicalHistory)`);
  if (p.medicalHistories.length === 0) lines.push("- None recorded");
  else {
    for (const m of p.medicalHistories) {
      const icd = m.icd10Code ? ` [${m.icd10Code}]` : "";
      const dx = m.diagnosedAt ? ` (dx ${m.diagnosedAt.toISOString().slice(0, 10)})` : "";
      lines.push(`- ${m.condition}${icd}${dx}${m.notes ? ` — ${m.notes.slice(0, 200)}` : ""}`);
    }
  }

  lines.push(`\n### Medications`);
  if (p.medications.length === 0) lines.push("- None recorded");
  else {
    for (const med of p.medications) {
      const prescriber = med.prescribedBy?.user?.name;
      lines.push(
        `- ${med.name}${med.dosage ? ` ${med.dosage}` : ""}${med.frequency ? `, ${med.frequency}` : ""}${prescriber ? ` (by ${prescriber})` : ""}`,
      );
    }
  }

  lines.push(`\n### Immunizations`);
  if (p.vaccinations.length === 0) lines.push("- None recorded");
  else {
    for (const v of p.vaccinations) {
      lines.push(
        `- ${v.name}${v.administeredAt ? ` @ ${v.administeredAt.toISOString().slice(0, 10)}` : ""}${v.batch ? ` batch ${v.batch}` : ""}`,
      );
    }
  }

  if (ctx.doctorProfileId) {
    const visits = await prisma.appointment.findMany({
      where: { patientId, doctorId: ctx.doctorProfileId },
      orderBy: { startsAt: "desc" },
      take: 8,
      select: {
        startsAt: true,
        endsAt: true,
        status: true,
        soapSummary: true,
        postCallNotes: true,
      },
    });
    lines.push(`\n### Recent visits (you ↔ patient)`);
    if (visits.length === 0) lines.push("- None");
    else {
      for (const a of visits) {
        const soap = a.soapSummary ? ` SOAP: ${a.soapSummary.slice(0, 280)}${a.soapSummary.length > 280 ? "…" : ""}` : "";
        const notes = a.postCallNotes
          ? ` Notes: ${a.postCallNotes.slice(0, 200)}${a.postCallNotes.length > 200 ? "…" : ""}`
          : "";
        lines.push(
          `- ${a.startsAt.toISOString().slice(0, 16)} — ${a.status}${soap}${notes}`,
        );
      }
    }
  }

  return lines.join("\n");
}

async function executeDoctorToolCall(
  prisma: PrismaClient,
  ctx: DoctorKbChatContext,
  name: string,
  argsJson: string,
): Promise<string> {
  try {
    if (name === "search_hospital_knowledge") {
      const { query } = JSON.parse(argsJson) as { query?: string };
      const q = typeof query === "string" ? query.trim() : "";
      if (!q) return "No query provided.";
      try {
        const hits = await retrieveHospitalKnowledgeSemantic(prisma, q, 8);
        return formatHospitalHitContent(hits);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "embedding error";
        return `Hospital KB search failed (${msg}). Ensure HUGGINGFACE_API_TOKEN/HF_TOKEN and embedded hospital chunks.`;
      }
    }
    if (name === "get_patient_clinical_summary") {
      const { patientEmail } = JSON.parse(argsJson) as { patientEmail?: string };
      return await formatPatientClinicalSummary(prisma, ctx, typeof patientEmail === "string" ? patientEmail : "");
    }
    if (name === "check_drug_interaction") {
      const { drugs } = JSON.parse(argsJson) as { drugs?: string[] };
      return JSON.stringify({
        notice:
          "Demo mode: no live drug–drug interaction API. Use institutional CDS, official drug references, or hospital KB for institutional protocols.",
        drugs: Array.isArray(drugs) ? drugs : [],
      });
    }
    return JSON.stringify({ error: `Unknown tool: ${name}` });
  } catch {
    return JSON.stringify({ error: "Invalid tool arguments" });
  }
}

/**
 * Multi-turn chat for doctors: hospital KB, optional patient chart (with relationship check), drug stub.
 */
export async function runDoctorKbAssistantChat(
  prisma: PrismaClient,
  userMessages: FeatherlessChatMessage[],
  ctx: DoctorKbChatContext,
): Promise<{ assistantMessage: string; messages: FeatherlessChatMessage[] }> {
  let messages = withDoctorSystem(userMessages);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await featherlessChatCompletions({
      messages,
      tools: DOCTOR_KB_TOOLS,
      tool_choice: "auto",
    });

    const msg = res.choices?.[0]?.message;
    if (!msg) {
      throw new Error("Empty LLM response");
    }

    if (!msg.tool_calls?.length) {
      const text = msg.content?.trim() ?? "";
      messages = [...messages, { role: "assistant", content: text }];
      return { assistantMessage: text, messages };
    }

    messages = [
      ...messages,
      { role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls },
    ];

    for (const tc of msg.tool_calls) {
      const result = await executeDoctorToolCall(prisma, ctx, tc.function.name, tc.function.arguments ?? "{}");
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result,
      });
    }
  }

  const finalRes = await featherlessChatCompletions({
    messages,
    max_tokens: 1024,
  });
  const text = finalRes.choices?.[0]?.message?.content?.trim() ?? "";
  messages = [...messages, { role: "assistant", content: text }];
  return { assistantMessage: text, messages };
}

/**
 * Multi-turn Featherless chat with patient-education KB + demo drug-interaction tool stub.
 */
export async function runKbAssistantChat(
  prisma: PrismaClient,
  userMessages: FeatherlessChatMessage[],
): Promise<{ assistantMessage: string; messages: FeatherlessChatMessage[] }> {
  let messages = withDefaultSystem(userMessages);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await featherlessChatCompletions({
      messages,
      tools: KB_TOOLS,
      tool_choice: "auto",
    });

    const msg = res.choices?.[0]?.message;
    if (!msg) {
      throw new Error("Empty LLM response");
    }

    if (!msg.tool_calls?.length) {
      const text = msg.content?.trim() ?? "";
      messages = [...messages, { role: "assistant", content: text }];
      return { assistantMessage: text, messages };
    }

    messages = [
      ...messages,
      { role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls },
    ];

    for (const tc of msg.tool_calls) {
      const result = await executeToolCall(prisma, tc.function.name, tc.function.arguments ?? "{}");
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result,
      });
    }
  }

  const finalRes = await featherlessChatCompletions({
    messages,
    max_tokens: 1024,
  });
  const text = finalRes.choices?.[0]?.message?.content?.trim() ?? "";
  messages = [...messages, { role: "assistant", content: text }];
  return { assistantMessage: text, messages };
}
