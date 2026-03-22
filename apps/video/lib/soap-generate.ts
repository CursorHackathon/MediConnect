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
      "Patient schildert Beschwerden im Rahmen der Videosprechstunde; keine weiteren freitextlichen Angaben.",
    objective:
      "Videosprechstunde; keine körperliche Untersuchung vor Ort. Telemedizinischer Kontakt hergestellt.",
    assessment:
      input.diagnoses[0] ??
      (input.diagnoses.length ? input.diagnoses.join(", ") : "Bekannte Diagnosen fortführen; klinische Bewertung eingeschränkt ohne Präsenzuntersuchung."),
    plan: "Wie in der Videosprechstunde besprochen. Bei Verschlechterung Hausarzt oder Notaufnahme aufsuchen.",
  };
  const summary = [
    "**Subjektiv (S):** " + structured.subjective,
    "**Objektiv (O):** " + structured.objective,
    "**Beurteilung (A):** " + structured.assessment,
    "**Plan (P):** " + structured.plan,
  ].join("\n\n");
  return { summary, structured };
}

export async function generateSoapDeutsch(input: SoapInput): Promise<SoapResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return stubSoap(input);
  }

  const prompt = `Du bist medizinischer Dokumentationsassistent für eine deutsche Praxis.
Erstelle ein SOAP-Protokoll auf Deutsch (formell, prägnant).

Patient: ${input.patientName}
Bekannte Allergien: ${input.allergies.join(", ") || "keine Angaben"}
Aktive Medikamente: ${input.medications.join("; ") || "keine Angaben"}
Bekannte Diagnosen: ${input.diagnoses.join("; ") || "keine Angaben"}

Freitext des Arztes zur Sprechstunde:
${input.postCallNotes || "(keine Notizen)"}

Antworte NUR mit gültigem JSON in genau dieser Form, ohne Markdown:
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
      "**Subjektiv (S):** " + structured.subjective,
      "**Objektiv (O):** " + structured.objective,
      "**Beurteilung (A):** " + structured.assessment,
      "**Plan (P):** " + structured.plan,
    ].join("\n\n");
    return { summary, structured };
  } catch {
    return stubSoap(input);
  }
}
