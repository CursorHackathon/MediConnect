import Link from "next/link";

import { getCurrentUser } from "@mediconnect/auth";
import { Role } from "@prisma/client";
import { Button } from "@mediconnect/ui";

import { KbChatClient } from "./kb-chat-client";

export const metadata = {
  title: "Clinical assistant — MediConnect AI Agent",
};

export default async function ChatPage() {
  const user = await getCurrentUser();
  const allowed = user && (user.role === Role.DOCTOR || user.role === Role.ADMIN);

  if (!allowed) {
    return (
      <main className="container max-w-lg py-16 text-center">
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

  return (
    <main className="container max-w-3xl py-8">
      <div className="mb-4 flex items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link href="/">← Home</Link>
        </Button>
      </div>
      <KbChatClient />
    </main>
  );
}
