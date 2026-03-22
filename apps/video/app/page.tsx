import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mediconnect/ui";

export default async function VideoHomePage() {
  const user = await getCurrentUser();

  if (user?.role === "DOCTOR" || user?.role === "ADMIN") {
    redirect("/doctor");
  }
  if (user?.role === "PATIENT") {
    redirect("/patient");
  }

  return (
    <main className="container space-y-8 py-12">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">MediConnect Video</h1>
        <Badge>E1</Badge>
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>
            Open <code className="text-xs">/login</code> and sign in with a seeded account (patient@, doctor@, or
            admin@mediconnect.local) so MediConnect Video can route you by role.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>After login you will be redirected to the patient or doctor area automatically.</p>
          <Button asChild>
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
