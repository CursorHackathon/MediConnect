import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";

import { AiAvatarCallClient } from "./ai-avatar-call-client";

export default async function PatientAiAvatarPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PATIENT") {
    redirect("/");
  }

  return (
    <main className="container py-6">
      <AiAvatarCallClient />
    </main>
  );
}
