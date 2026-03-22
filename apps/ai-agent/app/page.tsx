import { redirect } from "next/navigation";

/** Hub entry goes straight to the clinical chat UI (API remains at /api/v1/*). */
export default function AiAgentPage() {
  redirect("/chat");
}
