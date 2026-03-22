import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mediconnect/ui";

export default async function PatientVideoHubPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PATIENT") {
    redirect("/");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: user.id },
  });

  const appointments = patient
    ? await prisma.appointment.findMany({
        where: { patientId: patient.id },
        orderBy: { startsAt: "asc" },
        take: 20,
        include: {
          doctor: { include: { user: true } },
        },
      })
    : [];

  return (
    <main className="container space-y-6 py-10">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Video — Patient</h1>
        <Badge variant="outline">KI</Badge>
      </div>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle>KI-Gesundheitscoach (Avatar)</CardTitle>
          <CardDescription>
            Video-Gespräch mit der KI: Sie sprechen, die KI antwortet mit Stimme und digitalem Gesicht (LiveKit + Beyond
            Presence). Kein Arzt-Video nötig.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/patient/ai-avatar">Zum KI-Video</Link>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Arzttermine (optional)</CardTitle>
          <CardDescription>Falls Sie einen klassischen Videosprechstunden-Termin haben.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Termine.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((a) => (
                <li className="flex flex-wrap items-center justify-between gap-2 border-b pb-2" key={a.id}>
                  <div>
                    <p className="font-medium">{a.doctor?.user.name ?? "Arzt"}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.startsAt.toLocaleString("de-DE")} · {a.status}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/patient/appointments/${a.id}/call`}>Warteraum</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
