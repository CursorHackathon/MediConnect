import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

import { AppHubNav } from "@mediconnect/ui";

import { Providers } from "./providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediConnect Video",
  description: "E1 — Video consultation",
};

/** Simulated auth + Prisma run on every request; no static prerender (also fixes `next build` in Docker without DB). */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-ether-body min-h-screen bg-ether-surface text-ether-on-surface antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
          <div className="absolute -right-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-[#0058bb]/10 blur-[120px]" />
          <div className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-[#006a26]/10 blur-[100px]" />
        </div>
        <header className="sticky top-0 z-30 border-b border-white/35 bg-white/55 shadow-[0_12px_40px_rgba(45,47,51,0.07)] backdrop-blur-xl">
          <div className="container py-3">
            <AppHubNav current="video" />
          </div>
        </header>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
