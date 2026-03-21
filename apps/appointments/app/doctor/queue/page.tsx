import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";

import { DoctorQueueClient } from "./doctor-queue-client";

export default async function DoctorQueuePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "DOCTOR" && user.role !== "ADMIN") redirect("/");

  return <DoctorQueueClient />;
}
