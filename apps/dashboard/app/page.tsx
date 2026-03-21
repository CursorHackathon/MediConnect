import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";

import { DashboardShell } from "./components/dashboard-shell";
import { PatientList } from "./components/patient-list";
import { Header } from "./components/header";
import { PageTitle } from "./components/page-title";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: user.id },
    });

    if (!patient) {
      return (
        <div>
          <Header />
          <main className="container py-12">
            <p className="text-muted-foreground">No patient profile found.</p>
          </main>
        </div>
      );
    }

    return (
      <div>
        <Header />
        <main className="container space-y-6 py-8">
          <PageTitle type="patient" />
          <DashboardShell patientId={patient.id} role="PATIENT" />
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="container space-y-6 py-8">
        <PageTitle type="clinical" />
        <PatientList />
      </main>
    </div>
  );
}
