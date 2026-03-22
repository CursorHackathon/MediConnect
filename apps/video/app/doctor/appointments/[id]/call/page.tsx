import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";

import { DoctorCallClient } from "./doctor-call-client";

type PageProps = { params: Promise<{ id: string }> };

export default async function DoctorCallPage(props: PageProps) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "DOCTOR" && user.role !== "ADMIN")) {
    redirect("/");
  }

  const { id } = await props.params;

  return (
    <main className="container py-6">
      <DoctorCallClient appointmentId={id} />
    </main>
  );
}
