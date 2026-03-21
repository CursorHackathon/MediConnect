import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";

import { PatientBookClient } from "./patient-book-client";

export default async function PatientBookPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "PATIENT") redirect("/");

  return <PatientBookClient />;
}
