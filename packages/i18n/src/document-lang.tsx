"use client";

import { useEffect } from "react";

import { useTranslation } from "./provider";

/** Sets <html lang="de"|"en"> from the active locale (call once inside I18nProvider). */
export function DocumentLang() {
  const { locale } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "de";
  }, [locale]);
  return null;
}
