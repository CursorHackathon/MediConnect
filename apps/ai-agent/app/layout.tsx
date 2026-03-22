import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Toaster } from "@mediconnect/ui";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediConnect AI Agent",
  description: "E4 — Doctor AI agent (API + Cloud Run)",
};

/** Chat and other routes use Prisma; skip static prerender so `next build` works in Docker without DB. */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`min-h-screen antialiased ${inter.className}`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
