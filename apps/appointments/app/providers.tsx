"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DocumentLang, I18nProvider } from "@mediconnect/i18n";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1 },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <DocumentLang />
          {children}
        </I18nProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
