import { redirect } from "next/navigation";

export default function HomePage() {
  const target = process.env.NEXT_PUBLIC_URL_DASHBOARD?.trim() || "http://localhost:3002";
  redirect(`${target.replace(/\/$/, "")}/login`);
}
