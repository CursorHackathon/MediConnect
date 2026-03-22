import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mediconnect/ui";

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
          <CardTitle>No user for simulation</CardTitle>
          <CardDescription>
            Seed the database and set <code className="text-xs">SIMULATED_ROLE</code> (PATIENT, DOCTOR, or ADMIN) so a
            matching user is found.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Optional: set <code className="text-xs">SIMULATED_USER_ID</code> to a specific <code className="text-xs">User</code>{" "}
          id.
        </CardContent>
      </Card>
    </main>
  );
}
