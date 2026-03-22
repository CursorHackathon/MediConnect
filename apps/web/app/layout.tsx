import type { Metadata } from "next";

import { Toaster } from "@mediconnect/ui";

import { Providers } from "./providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "MediConnect",
  description: "German telehealth platform shell",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
