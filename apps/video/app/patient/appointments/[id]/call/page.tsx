import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";

import { PatientCallClient } from "./patient-call-client";

type PageProps = { params: Promise<{ id: string }> };

export default async function PatientCallPage(props: PageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PATIENT") {
    redirect("/");
  }

  const { id } = await props.params;

  return (
    <main className="container py-6">
      <PatientCallClient appointmentId={id} />
    </main>
  );
}
