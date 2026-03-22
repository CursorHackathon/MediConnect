"use client";

import { Toaster } from "@mediconnect/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
