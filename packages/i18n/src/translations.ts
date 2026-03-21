import type { Locale } from "./types";
import { appointmentsDe, appointmentsEn } from "./appointments-translations";
import { dashboardBundle } from "./dashboard-translations";

export const translations: Record<Locale, Record<string, string>> = {
  de: { ...dashboardBundle.de, ...appointmentsDe },
  en: { ...dashboardBundle.en, ...appointmentsEn },
};
