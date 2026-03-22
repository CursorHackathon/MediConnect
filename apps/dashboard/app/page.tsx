import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";

import { MediConnectGlassApp } from "./components/medi-connect-glass-app";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const patientId = user.patient?.id ?? null;
  const mode = user.role === "PATIENT" ? "patient" : "clinical";

  return (
    <MediConnectGlassApp
      mode={mode}
      patientId={patientId}
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      }}
    />
  );
}
