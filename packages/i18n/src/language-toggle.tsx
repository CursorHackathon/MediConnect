"use client";

import { useTranslation } from "./provider";

type Props = {
  className?: string;
  /** Accessible label (default: Toggle language) */
  "aria-label"?: string;
};

export function LanguageToggle({ className, "aria-label": ariaLabel }: Props) {
  const { locale, setLocale } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "de" ? "en" : "de")}
      className={
        className ??
        "rounded-md border border-input bg-background px-2 py-1 text-xs font-medium hover:bg-accent"
      }
      aria-label={ariaLabel ?? "Toggle language"}
    >
      {locale === "de" ? "DE" : "EN"}
    </button>
  );
}
