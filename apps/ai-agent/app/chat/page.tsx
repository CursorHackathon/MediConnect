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
          Sign in with a doctor or administrator account to use the clinical assistant.
        </p>
        <Button asChild variant="secondary">
          <Link href="/login">Sign in</Link>
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
