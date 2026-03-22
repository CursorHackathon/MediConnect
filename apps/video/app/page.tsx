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
          <CardTitle>Kein Nutzer für die Simulation</CardTitle>
          <CardDescription>
            Bitte Datenbank seeden und <code className="text-xs">SIMULATED_ROLE</code> setzen (PATIENT, DOCTOR oder
            ADMIN), damit ein passender Nutzer gefunden wird.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Optional: <code className="text-xs">SIMULATED_USER_ID</code> auf eine konkrete <code className="text-xs">User</code>
          -ID setzen.
        </CardContent>
      </Card>
    </main>
  );
}
