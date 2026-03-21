import { describe, expect, it } from "vitest";

import {
  computeVaccinationStatus,
  daysUntil,
  formatDateDE,
  getInitials,
  FREQUENCY_LABELS,
  VACCINATION_STATUS_CONFIG,
} from "../utils";

describe("formatDateDE", () => {
  it("formats a Date object to DD.MM.YYYY", () => {
    expect(formatDateDE(new Date("2024-03-15"))).toBe("15.03.2024");
  });

  it("formats an ISO string", () => {
    expect(formatDateDE("2023-12-01T00:00:00.000Z")).toBe("01.12.2023");
  });

  it('returns "—" for null', () => {
    expect(formatDateDE(null)).toBe("—");
  });

  it('returns "—" for undefined', () => {
    expect(formatDateDE(undefined)).toBe("—");
  });
});

describe("getInitials", () => {
  it("extracts initials from full name", () => {
    expect(getInitials("Max Weber")).toBe("MW");
  });

  it("handles single name", () => {
    expect(getInitials("Admin")).toBe("A");
  });

  it("limits to 2 characters", () => {
    expect(getInitials("Dr. Hans Mueller")).toBe("DH");
  });

  it('returns "?" for null', () => {
    expect(getInitials(null)).toBe("?");
  });
});

describe("computeVaccinationStatus", () => {
  it('returns "OVERDUE" when nextDueDate is null', () => {
    expect(computeVaccinationStatus(null)).toBe("OVERDUE");
  });

  it('returns "OVERDUE" when nextDueDate is in the past', () => {
    const pastDate = new Date(Date.now() - 86_400_000);
    expect(computeVaccinationStatus(pastDate)).toBe("OVERDUE");
  });

  it('returns "DUE_SOON" when nextDueDate is within 30 days', () => {
    const soonDate = new Date(Date.now() + 15 * 86_400_000);
    expect(computeVaccinationStatus(soonDate)).toBe("DUE_SOON");
  });

  it('returns "UP_TO_DATE" when nextDueDate is more than 30 days out', () => {
    const futureDate = new Date(Date.now() + 90 * 86_400_000);
    expect(computeVaccinationStatus(futureDate)).toBe("UP_TO_DATE");
  });

  it("handles ISO string input", () => {
    const futureDate = new Date(Date.now() + 365 * 86_400_000).toISOString();
    expect(computeVaccinationStatus(futureDate)).toBe("UP_TO_DATE");
  });
});

describe("daysUntil", () => {
  it("returns positive number for future dates", () => {
    const future = new Date(Date.now() + 10 * 86_400_000);
    const result = daysUntil(future);
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });

  it("returns negative number for past dates", () => {
    const past = new Date(Date.now() - 5 * 86_400_000);
    const result = daysUntil(past);
    expect(result).toBeLessThan(0);
  });

  it("returns null for null input", () => {
    expect(daysUntil(null)).toBeNull();
  });
});

describe("FREQUENCY_LABELS", () => {
  it("maps ONCE_DAILY to German", () => {
    expect(FREQUENCY_LABELS.ONCE_DAILY).toBe("1x täglich");
  });

  it("maps TWICE_DAILY to German", () => {
    expect(FREQUENCY_LABELS.TWICE_DAILY).toBe("2x täglich");
  });

  it("maps AS_NEEDED to German", () => {
    expect(FREQUENCY_LABELS.AS_NEEDED).toBe("Bei Bedarf");
  });
});

describe("VACCINATION_STATUS_CONFIG", () => {
  it("has green styling for UP_TO_DATE", () => {
    const cfg = VACCINATION_STATUS_CONFIG.UP_TO_DATE;
    expect(cfg.label).toBe("Aktuell");
    expect(cfg.className).toContain("green");
  });

  it("has amber styling for DUE_SOON", () => {
    const cfg = VACCINATION_STATUS_CONFIG.DUE_SOON;
    expect(cfg.label).toBe("Fällig");
    expect(cfg.className).toContain("amber");
  });

  it("has red styling for OVERDUE", () => {
    const cfg = VACCINATION_STATUS_CONFIG.OVERDUE;
    expect(cfg.label).toBe("Überfällig");
    expect(cfg.className).toContain("red");
  });
});
