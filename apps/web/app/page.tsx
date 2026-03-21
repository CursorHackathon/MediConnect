import Link from "next/link";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mediconnect/ui";

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col gap-8 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">MediConnect</h1>
        <p className="text-muted-foreground">Telehealth platform shell — rollenbasierter Zugang.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Anmeldung</CardTitle>
            <CardDescription>Zugang für Patienten, Ärztinnen und Verwaltung.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bereiche</CardTitle>
            <CardDescription>Interne Routen (geschützt).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Link className="text-primary underline-offset-4 hover:underline" href="/patient">
              Patient
            </Link>
            <Link className="text-primary underline-offset-4 hover:underline" href="/doctor">
              Arzt
            </Link>
            <Link className="text-primary underline-offset-4 hover:underline" href="/admin">
              Admin
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
