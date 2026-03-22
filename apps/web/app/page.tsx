import Link from "next/link";

import { AppHubNav, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mediconnect/ui";

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col gap-8 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">MediConnect</h1>
        <p className="text-muted-foreground">
          Telehealth platform shell — role-based access via <code className="text-xs">SIMULATED_ROLE</code> (local dev).
        </p>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-foreground">All applications</p>
          <AppHubNav current="web" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Simulate roles</CardTitle>
            <CardDescription>
              Set in <code className="text-xs">.env</code>, for example{" "}
              <code className="text-xs">SIMULATED_ROLE=PATIENT</code>, <code className="text-xs">DOCTOR</code>, or{" "}
              <code className="text-xs">ADMIN</code>, then restart the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Optional: <code className="text-xs">SIMULATED_USER_ID</code> for a specific user from the database.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Areas</CardTitle>
            <CardDescription>Routes (protected by simulated role).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Button asChild variant="outline" className="w-fit">
              <Link href="/patient">Patient</Link>
            </Button>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/doctor">Doctor</Link>
            </Button>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/admin">Admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
