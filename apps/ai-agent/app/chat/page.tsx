import Link from "next/link";

import { getCurrentUser } from "@mediconnect/auth";
import { Role } from "@prisma/client";
import { AppHubNav, Button } from "@mediconnect/ui";

import { KbChatClient } from "./kb-chat-client";

export const metadata = {
  title: "Clinical assistant — MediConnect AI Agent",
};

export default async function ChatPage() {
  const user = await getCurrentUser();
  const allowed = user && (user.role === Role.DOCTOR || user.role === Role.ADMIN);

  if (!allowed) {
    return (
      <main className="container max-w-lg space-y-6 py-16 text-center">
        <AppHubNav current="aiAgent" className="[&_ul]:justify-center" />
        <h1 className="mb-2 text-xl font-semibold text-foreground">Doctor or admin access required</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          This assistant uses hospital knowledge search and optional patient chart tools. For local dev, set{" "}
          <code className="rounded bg-muted px-1">SIMULATED_ROLE=DOCTOR</code> or{" "}
          <code className="rounded bg-muted px-1">SIMULATED_USER_ID</code> to a doctor user in{" "}
          <code className="rounded bg-muted px-1">.env</code> (same pattern as the video app).
        </p>
        <Button asChild variant="secondary">
          <Link href="/">← Home</Link>
        </Button>
      </main>
    );
  }

  const doctorDisplayName = user.name?.trim() || user.email.split("@")[0] || "Doctor";
  const specialtyLabel =
    user.role === Role.ADMIN && !user.doctor?.specialty
      ? "Administrator"
      : user.doctor?.specialty?.trim() || "Clinical practice";

  return (
    <KbChatClient
      doctorDisplayName={doctorDisplayName}
      specialtyLabel={specialtyLabel}
      avatarUrl={user.image}
      patientLabel="#PX-8821"
    />
  );
}
