import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";
import { Badge, Button } from "@mediconnect/ui";

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
    <main className="relative z-10 mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-ether-headline text-3xl font-bold tracking-tight text-blue-800 dark:text-blue-300">
          Video visit — Doctor
        </h1>
        <Badge variant="outline" className="border-blue-200/80 bg-white/50 font-medium backdrop-blur-sm">
          E1
        </Badge>
      </div>

      <section className="ether-glass-panel rounded-3xl border border-white/45 p-8 shadow-[0_24px_60px_rgba(45,47,51,0.08)]">
        <h2 className="font-ether-headline text-xl font-bold text-ether-on-surface">Appointments</h2>
        <p className="mt-1 text-sm text-ether-on-surface-variant">Select an appointment to start the call.</p>

        <div className="mt-6 space-y-3">
          {appointments.length === 0 ? (
            <p className="rounded-2xl border border-white/30 bg-white/30 py-8 text-center text-sm text-ether-on-surface-variant backdrop-blur-sm">
              No appointments found.
            </p>
          ) : (
            <ul className="space-y-3">
              {appointments.map((a) => (
                <li
                  key={a.id}
                  className="ether-glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/40 p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold text-ether-on-surface">{a.patient.user.name ?? "Patient"}</p>
                    <p className="mt-0.5 text-xs text-ether-on-surface-variant">
                      {a.startsAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {a.status}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-slate-900 text-white shadow-md hover:bg-slate-800"
                  >
                    <Link href={`/doctor/appointments/${a.id}/call`}>Open visit</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
