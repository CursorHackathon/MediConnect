import { redirect, notFound } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";

import { DashboardShell } from "@/app/components/dashboard-shell";
import { Header } from "@/app/components/header";

type Props = { params: { patientId: string } };

export default async function PatientDashboardPage({ params }: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "PATIENT") {
    redirect("/");
  }

  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    include: { user: { select: { name: true } } },
  });

  if (!patient) {
    notFound();
  }

  return (
    <div>
      <Header />
      <main className="container space-y-6 py-8">
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-primary underline">
            ← Patient list
          </a>
          <h1 className="text-2xl font-semibold">{patient.user.name || "Patient"}</h1>
        </div>
        <DashboardShell patientId={patient.id} role={user.role} />
      </main>
    </div>
  );
}
