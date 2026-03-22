import { getLlmConfig } from "./llm-config";

export type FeatherlessToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type FeatherlessChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: FeatherlessToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type FeatherlessChatCompletionsResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: FeatherlessToolCall[];
    };
  }>;
  error?: { message?: string; type?: string };
};

export const HOSPITAL_KB_TOOL = {
  type: "function" as const,
  function: {
    name: "search_hospital_knowledge",
    description:
      "Search the hospital knowledge base (uploaded protocols, guidelines, internal documents) for relevant passages. Use when the user asks about hospital-specific policies or document content.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Concise search query (keywords or short phrase)",
        },
      },
      required: ["query"],
    },
  },
};

export const PATIENT_KB_TOOL = {
  type: "function" as const,
  function: {
    name: "search_patient_knowledge",
    description:
      "Search patient-facing health education passages (plain English, tagged audience:patient). Use for symptoms, conditions, medications, and self-care questions. Only rely on retrieved passages plus general safety rules — never invent specific medical facts.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Concise search query (symptom, condition, or medication keywords)",
        },
      },
      required: ["query"],
    },
  },
};

export const PATIENT_CHART_TOOL = {
  type: "function" as const,
  function: {
    name: "get_patient_clinical_summary",
    description:
      "Load structured chart data for a patient you treat: demographics, allergies, conditions (ICD-10 when stored), medications, immunizations, and recent visits with you. Requires the patient's login email. For doctors, at least one prior appointment with this patient is required.",
    parameters: {
      type: "object",
      properties: {
        patientEmail: {
          type: "string",
          description: "Patient account email (same as login)",
        },
      },
      required: ["patientEmail"],
    },
  },
};

export const DRUG_INTERACTION_TOOL = {
  type: "function" as const,
  function: {
    name: "check_drug_interaction",
    description: "Check interactions between drugs (demo stub — suggests using KB or professional databases).",
    parameters: {
      type: "object",
      properties: {
        drugs: {
          type: "array",
          items: { type: "string" },
          description: "Drug names to check",
        },
      },
      required: ["drugs"],
    },
  },
};

export async function featherlessChatCompletions(params: {
  messages: FeatherlessChatMessage[];
  tools?: object[];
  tool_choice?: "auto" | "none" | "required";
  temperature?: number;
  max_tokens?: number;
}): Promise<FeatherlessChatCompletionsResponse> {
  const { baseUrl, apiKey, model } = getLlmConfig();
  if (!baseUrl || !apiKey) {
    throw new Error("LLM_BASE_URL and LLM_API_KEY must be set");
  }

  const body: Record<string, unknown> = {
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.3,
    max_tokens: params.max_tokens ?? 2048,
  };
  if (params.tools?.length) {
    body.tools = params.tools;
    body.tool_choice = params.tool_choice ?? "auto";
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as FeatherlessChatCompletionsResponse;
  if (!res.ok) {
    const msg = json.error?.message ?? JSON.stringify(json).slice(0, 400);
    throw new Error(`LLM API ${res.status}: ${msg}`);
  }
  return json;
}
