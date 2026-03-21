import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";

import { PatientQueueClient } from "./patient-queue-client";

export default async function PatientQueuePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "PATIENT") redirect("/");

  return <PatientQueueClient />;
}
