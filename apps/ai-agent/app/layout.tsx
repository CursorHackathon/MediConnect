import type { Metadata } from "next";

import { Toaster } from "@mediconnect/ui";

import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect AI Agent",
  description: "E4 — Doctor AI agent (API + Cloud Run)",
};

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
