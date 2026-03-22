import type { Locale } from "./types";

/** BCP 47 tag for `toLocaleString` / `Intl` (English only). */
export function localeTag(_locale: Locale): string {
  return "en-GB";
}
