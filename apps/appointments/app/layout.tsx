import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

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
  title: "MediConnect Appointments",
  description: "E3 — Appointments and queue",
};

/** Pages use Prisma; skip static prerender so `next build` works in Docker without DB. */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-ether-body min-h-screen bg-ether-surface text-ether-on-surface antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
          <div className="absolute -right-[12%] -top-[12%] h-[48%] w-[48%] rounded-full bg-[#0058bb]/10 blur-[110px]" />
          <div className="absolute -bottom-[12%] -left-[8%] h-[42%] w-[42%] rounded-full bg-[#4c49c9]/10 blur-[95px]" />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
