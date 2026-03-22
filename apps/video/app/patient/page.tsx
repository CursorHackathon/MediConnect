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
        <Badge variant="outline">AI</Badge>
      </div>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle>AI health coach (avatar)</CardTitle>
          <CardDescription>
            Video conversation with the AI: you speak, it responds with voice and a digital face. No doctor video
            required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/patient/ai-avatar">Open AI video</Link>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Doctor appointments (optional)</CardTitle>
          <CardDescription>If you have a classic video visit scheduled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((a) => (
                <li className="flex flex-wrap items-center justify-between gap-2 border-b pb-2" key={a.id}>
                  <div>
                    <p className="font-medium">{a.doctor?.user.name ?? "Doctor"}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.startsAt.toLocaleString("en-US")} · {a.status}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/patient/appointments/${a.id}/call`}>Waiting room</Link>
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
