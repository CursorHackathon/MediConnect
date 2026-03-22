"use client";

import { useEffect } from "react";

/** Sets `<html lang="en">` (call once inside I18nProvider). */
export function DocumentLang() {
  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);
  return null;
}
