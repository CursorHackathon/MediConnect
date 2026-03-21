import { describe, expect, it } from "vitest";

import {
  eachDateYmdInRange,
  jsWeekdayFromYmd,
  luxonWeekdayToJs,
  mergeRulesForDay,
  overlaps,
  slotsForRuleOnDay,
} from "./slots";

describe("luxonWeekdayToJs", () => {
  it("maps Monday–Sunday to JS getDay", () => {
    expect(luxonWeekdayToJs(1)).toBe(1);
    expect(luxonWeekdayToJs(7)).toBe(0);
  });
});

describe("jsWeekdayFromYmd", () => {
  it("returns consistent weekday for a known date", () => {
    expect(jsWeekdayFromYmd("2025-03-21", "Europe/Berlin")).toBe(5);
  });
});

describe("slotsForRuleOnDay", () => {
  it("emits 30-min slots within window", () => {
    const rule = {
      weekday: 5,
      slotDurationMinutes: 30,
      startTime: "09:00",
      endTime: "10:30",
      timezone: "Europe/Berlin",
    };
    const slots = slotsForRuleOnDay("2025-03-21", rule);
    expect(slots).toHaveLength(3);
    expect(slots[0].startsAt < slots[0].endsAt).toBe(true);
  });

  it("returns empty when weekday does not match", () => {
    const rule = {
      weekday: 1,
      slotDurationMinutes: 30,
      startTime: "09:00",
      endTime: "10:00",
      timezone: "Europe/Berlin",
    };
    expect(slotsForRuleOnDay("2025-03-21", rule)).toHaveLength(0);
  });
});

describe("mergeRulesForDay", () => {
  it("merges and sorts multiple rules", () => {
    const rules = [
      {
        weekday: 5,
        slotDurationMinutes: 30,
        startTime: "10:00",
        endTime: "11:00",
        timezone: "Europe/Berlin",
      },
      {
        weekday: 5,
        slotDurationMinutes: 30,
        startTime: "09:00",
        endTime: "09:30",
        timezone: "Europe/Berlin",
      },
    ];
    const merged = mergeRulesForDay("2025-03-21", rules);
    expect(merged[0].startsAt.getTime()).toBeLessThan(merged[1].startsAt.getTime());
  });
});

describe("overlaps", () => {
  it("detects overlap", () => {
    const a0 = new Date("2025-01-01T10:00:00.000Z");
    const a1 = new Date("2025-01-01T10:30:00.000Z");
    const b0 = new Date("2025-01-01T10:15:00.000Z");
    const b1 = new Date("2025-01-01T10:45:00.000Z");
    expect(overlaps(a0, a1, b0, b1)).toBe(true);
  });

  it("returns false for adjacent intervals", () => {
    const a0 = new Date("2025-01-01T10:00:00.000Z");
    const a1 = new Date("2025-01-01T10:30:00.000Z");
    const b0 = new Date("2025-01-01T10:30:00.000Z");
    const b1 = new Date("2025-01-01T11:00:00.000Z");
    expect(overlaps(a0, a1, b0, b1)).toBe(false);
  });
});

describe("eachDateYmdInRange", () => {
  it("includes both endpoints", () => {
    const from = new Date("2025-03-01T12:00:00.000Z");
    const to = new Date("2025-03-03T12:00:00.000Z");
    expect(eachDateYmdInRange(from, to)).toEqual(["2025-03-01", "2025-03-02", "2025-03-03"]);
  });
});
