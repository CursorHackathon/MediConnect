import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";

import { AvailabilityClient } from "./availability-client";

export default async function DoctorAvailabilityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "DOCTOR" && user.role !== "ADMIN") redirect("/");

  return <AvailabilityClient />;
}
