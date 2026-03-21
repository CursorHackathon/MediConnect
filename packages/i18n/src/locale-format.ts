import type { Locale } from "./types";

/** BCP 47 locale for `toLocaleString` / `Intl` based on app locale. */
export function localeTag(locale: Locale): string {
  return locale === "en" ? "en-GB" : "de-DE";
}
