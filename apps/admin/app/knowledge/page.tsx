import Link from "next/link";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@mediconnect/ui";

import { KnowledgeUploadForm } from "./knowledge-upload-form";

export default async function AdminKnowledgePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return (
      <main className="container py-12">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Knowledge base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Admin simulation only: set <code className="text-xs">SIMULATED_ROLE=ADMIN</code> in{" "}
              <code className="text-xs">.env</code> and restart the app.
            </p>
            {user ? <p className="text-xs">Current: {user.email} ({user.role})</p> : null}
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/">← Back</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const rows = await prisma.knowledgeChunk.findMany({ select: { metadata: true } });
  const hospital = rows.filter((r) => (r.metadata as Record<string, unknown> | null)?.kind === "hospital_upload");

  return (
    <main className="container space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">← Admin</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Knowledge base</h1>
        <Badge variant="outline">E1</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Hospital chunks: <span className="font-medium text-foreground">{hospital.length}</span>
          </p>
          <p>
            All chunks (incl. seed): <span className="font-medium text-foreground">{rows.length}</span>
          </p>
        </CardContent>
      </Card>

      <KnowledgeUploadForm />
    </main>
  );
}
