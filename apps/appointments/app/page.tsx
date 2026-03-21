import { redirect } from "next/navigation";

import { getCurrentUser } from "@mediconnect/auth";

import { HomeNoRole } from "./components/home-no-role";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "PATIENT") {
    redirect("/patient/book");
  }
  if (user.role === "DOCTOR" || user.role === "ADMIN") {
    redirect("/doctor/queue");
  }
  return <HomeNoRole />;
}
