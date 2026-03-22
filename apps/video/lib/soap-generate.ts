export type SoapInput = {
  patientName: string;
  allergies: string[];
  medications: string[];
  diagnoses: string[];
  postCallNotes: string;
};

export type SoapResult = {
  summary: string;
  structured: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
};

function stubSoap(input: SoapInput): SoapResult {
  const structured = {
    subjective:
      input.postCallNotes.trim() ||
      "Patient reports concerns during the video visit; no additional free-text documentation.",
    objective:
      "Video visit; no in-person physical exam. Telemedicine contact established.",
    assessment:
      input.diagnoses[0] ??
      (input.diagnoses.length
        ? input.diagnoses.join(", ")
        : "Continue known diagnoses; clinical assessment limited without in-person exam."),
    plan: "As discussed during the video visit. Worsening symptoms: contact PCP or emergency care.",
  };
  const summary = [
    "**Subjective (S):** " + structured.subjective,
    "**Objective (O):** " + structured.objective,
    "**Assessment (A):** " + structured.assessment,
    "**Plan (P):** " + structured.plan,
  ].join("\n\n");
  return { summary, structured };
}

/** Generates an English SOAP note (Claude if `ANTHROPIC_API_KEY` is set; otherwise stub). */
export async function generateSoapNote(input: SoapInput): Promise<SoapResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return stubSoap(input);
  }

  const prompt = `You are a medical documentation assistant for a clinical practice.
Write a concise, professional SOAP note in English.

Patient: ${input.patientName}
Known allergies: ${input.allergies.join(", ") || "not documented"}
Active medications: ${input.medications.join("; ") || "not documented"}
Known diagnoses: ${input.diagnoses.join("; ") || "not documented"}

Clinician free text about the visit:
${input.postCallNotes || "(no notes)"}

Reply ONLY with valid JSON in exactly this shape, no markdown:
{"subjective":"...","objective":"...","assessment":"...","plan":"..."}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    return stubSoap(input);
  }

  const body = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = body.content?.find((c) => c.type === "text")?.text ?? "";
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    const raw = JSON.parse(text.slice(jsonStart, jsonEnd)) as Record<string, string>;
    const structured = {
      subjective: String(raw.subjective ?? ""),
      objective: String(raw.objective ?? ""),
      assessment: String(raw.assessment ?? ""),
      plan: String(raw.plan ?? ""),
    };
    const summary = [
      "**Subjective (S):** " + structured.subjective,
      "**Objective (O):** " + structured.objective,
      "**Assessment (A):** " + structured.assessment,
      "**Plan (P):** " + structured.plan,
    ].join("\n\n");
    return { summary, structured };
  } catch {
    return stubSoap(input);
  }
}
