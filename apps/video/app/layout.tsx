import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect Video",
  description: "E1 — Video consultation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
