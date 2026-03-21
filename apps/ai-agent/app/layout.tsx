import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect AI Agent",
  description: "E4 — Doctor AI agent (API + Cloud Run)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
