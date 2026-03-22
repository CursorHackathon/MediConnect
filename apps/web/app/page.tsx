import Link from "next/link";

import { AppHubNav, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mediconnect/ui";

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col gap-8 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">MediConnect</h1>
        <p className="text-muted-foreground">
          Telehealth platform shell — rollenbasierter Zugang per <code className="text-xs">SIMULATED_ROLE</code> (lokal).
        </p>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-foreground">Alle Anwendungen</p>
          <AppHubNav current="web" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rollen simulieren</CardTitle>
            <CardDescription>
              Setzen Sie in <code className="text-xs">.env</code> z. B.{" "}
              <code className="text-xs">SIMULATED_ROLE=PATIENT</code>, <code className="text-xs">DOCTOR</code> oder{" "}
              <code className="text-xs">ADMIN</code> und starten Sie die App neu.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Optional: <code className="text-xs">SIMULATED_USER_ID</code> für einen konkreten Nutzer aus der Datenbank.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bereiche</CardTitle>
            <CardDescription>Routen (geschützt nach simulierter Rolle).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Button asChild variant="outline" className="w-fit">
              <Link href="/patient">Patient</Link>
            </Button>
            <Button asChild variant="outline" className="w-fit">
              <Link href="/doctor">Arzt</Link>
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
