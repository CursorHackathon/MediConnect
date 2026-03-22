"use client";

import { Button } from "./components/ui/button";

export type AppHubId = "video" | "dashboard" | "appointments" | "aiAgent" | "admin";

/** Base URLs for each Next.js app (browser must reach host + published port). */
export function getAppHubUrls(): Record<AppHubId, string> {
  return {
    video: process.env.NEXT_PUBLIC_URL_VIDEO ?? "http://localhost:3001",
    dashboard: process.env.NEXT_PUBLIC_URL_DASHBOARD ?? "http://localhost:3002",
    appointments: process.env.NEXT_PUBLIC_URL_APPOINTMENTS ?? "http://localhost:3003",
    aiAgent: process.env.NEXT_PUBLIC_URL_AI_AGENT ?? "http://localhost:3004",
    admin: process.env.NEXT_PUBLIC_URL_ADMIN ?? "http://localhost:3005",
  };
}

const LABELS: Record<AppHubId, string> = {
  video: "Video",
  dashboard: "Dashboard",
  appointments: "Appointments",
  aiAgent: "Doctor AI",
  admin: "Admin",
};

const ORDER: AppHubId[] = ["dashboard", "video", "appointments", "aiAgent", "admin"];

export function AppHubNav({
  current,
  className,
}: {
  current?: AppHubId;
  className?: string;
}) {
  const urls = getAppHubUrls();

  return (
    <nav className={className} aria-label="MediConnect applications">
      <ul className="flex flex-wrap items-center gap-2">
        {ORDER.map((id) => (
          <li key={id}>
            <Button asChild variant={id === current ? "secondary" : "outline"} size="sm">
              <a href={urls[id]} rel="noopener noreferrer">
                {LABELS[id]}
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
