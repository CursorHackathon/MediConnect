import type { Metadata } from "next";

import { AppHubNav } from "@mediconnect/ui";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect Video",
  description: "E1 — Video consultation",
};

/** Simulated auth + Prisma run on every request; no static prerender (also fixes `next build` in Docker without DB). */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="border-b bg-muted/40">
          <div className="container py-2">
            <AppHubNav current="video" />
          </div>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
