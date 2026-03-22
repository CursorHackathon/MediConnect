import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mediconnect/ui";

export default async function DoctorVideoHubPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "DOCTOR" && user.role !== "ADMIN")) {
    redirect("/");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
  });

  const appointments = doctor
    ? await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        orderBy: { startsAt: "asc" },
        take: 20,
        include: {
          patient: { include: { user: true } },
        },
      })
    : [];

  return (
    <main className="container space-y-6 py-10">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Video visit — Doctor</h1>
        <Badge variant="outline">E1</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>Select an appointment to start the call.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments found.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((a) => (
                <li className="flex flex-wrap items-center justify-between gap-2 border-b pb-2" key={a.id}>
                  <div>
                    <p className="font-medium">{a.patient.user.name ?? "Patient"}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.startsAt.toLocaleString("en-US")} · {a.status}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/doctor/appointments/${a.id}/call`}>Open visit</Link>
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
