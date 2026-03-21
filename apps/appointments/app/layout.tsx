import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect Appointments",
  description: "E3 — Appointments and queue",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
