"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { Locale } from "./types";
import { translations } from "./translations";

export type { Locale } from "./types";

export const STORAGE_KEY = "mediconnect-locale";

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nCtx>({
  locale: "de",
  setLocale: () => {},
  t: (k) => k,
});

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "de";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "de") return stored;
  return "de";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setHydrated(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = translations[locale][key] || translations.de[key] || key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [locale],
  );

  if (!hydrated) {
    return (
      <I18nContext.Provider value={{ locale: "de", setLocale, t }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
