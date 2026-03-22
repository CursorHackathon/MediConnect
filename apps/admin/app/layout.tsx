import type { Metadata } from "next";

import { AppHubNav } from "@mediconnect/ui";

import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect Admin",
  description: "E5 — RBAC, users, medications",
};

/** Admin UI and APIs use Prisma; skip static prerender so `next build` works in Docker without DB. */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">
        <div className="border-b bg-muted/40">
          <div className="container py-2">
            <AppHubNav current="admin" />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
