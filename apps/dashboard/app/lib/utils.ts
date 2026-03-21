import type { VaccinationStatus } from "@prisma/client";

export function formatDateDE(date: Date | string | null | undefined, locale: string = "de"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const loc = locale === "en" ? "en-GB" : "de-DE";
  return d.toLocaleDateString(loc, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const FREQUENCY_LABELS: Record<string, string> = {
  ONCE_DAILY: "1x täglich",
  TWICE_DAILY: "2x täglich",
  THREE_TIMES_DAILY: "3x täglich",
  AS_NEEDED: "Bei Bedarf",
};

export const VACCINATION_STATUS_CONFIG: Record<
  VaccinationStatus,
  { label: string; className: string }
> = {
  UP_TO_DATE: {
    label: "Aktuell",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  DUE_SOON: {
    label: "Fällig",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  OVERDUE: {
    label: "Überfällig",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export const VISIT_TYPE_LABELS: Record<string, string> = {
  DIAGNOSIS: "Diagnose",
  HOSPITAL_VISIT: "Krankenhausbesuch",
  SURGERY: "Operation",
  OTHER: "Sonstiges",
};

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function computeVaccinationStatus(
  nextDueDate: Date | string | null | undefined,
): VaccinationStatus {
  if (!nextDueDate) return "OVERDUE";
  const due = typeof nextDueDate === "string" ? new Date(nextDueDate) : nextDueDate;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (due <= now) return "OVERDUE";
  if (due <= thirtyDaysFromNow) return "DUE_SOON";
  return "UP_TO_DATE";
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
