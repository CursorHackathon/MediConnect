import type { Metadata } from "next";

import { Toaster } from "@mediconnect/ui";

import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect AI Agent",
  description: "E4 — Doctor AI agent (API + Cloud Run)",
};

/** Chat and other routes use Prisma; skip static prerender so `next build` works in Docker without DB. */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
