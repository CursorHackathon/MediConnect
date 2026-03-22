"use client";

import { createContext, useCallback, useContext } from "react";

import type { Locale } from "./types";
import { translations } from "./translations";

export type { Locale } from "./types";

type I18nCtx = {
  /** Always `"en"` — kept for date formatting helpers (`localeTag`). */
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nCtx>({
  locale: "en",
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    let str = translations[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }, []);

  return <I18nContext.Provider value={{ locale: "en", t }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
