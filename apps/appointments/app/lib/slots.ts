import { DateTime } from "luxon";

export type RuleInput = {
  weekday: number;
  slotDurationMinutes: number;
  startTime: string;
  endTime: string;
  timezone: string;
};

export type SlotCandidate = { startsAt: Date; endsAt: Date };

/** JS getDay(): 0 Sun … 6 Sat — matches Prisma `weekday` on rules */
export function jsWeekdayFromYmd(dateYmd: string, zone = "Europe/Berlin"): number {
  const dt = DateTime.fromISO(dateYmd, { zone }).startOf("day");
  return luxonWeekdayToJs(dt.weekday);
}

function parseYmd(dateYmd: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateYmd.split("-").map(Number);
  return { year: y, month: m, day: d };
}

/** Monday=1 … Sunday=7 in Luxon; map to JS 0=Sun … 6=Sat */
export function luxonWeekdayToJs(weekday: number): number {
  return weekday === 7 ? 0 : weekday;
}

export function jsWeekdayFromDateTime(dt: DateTime): number {
  return luxonWeekdayToJs(dt.weekday);
}

function wallOnDate(dateYmd: string, hhmm: string, zone: string): DateTime {
  const { year, month, day } = parseYmd(dateYmd);
  const [h, mi] = hhmm.split(":").map(Number);
  return DateTime.fromObject(
    { year, month, day, hour: h, minute: mi, second: 0, millisecond: 0 },
    { zone },
  );
}

/**
 * All slot starts for one calendar day, one rule (weekday must match day or empty).
 */
export function slotsForRuleOnDay(dateYmd: string, rule: RuleInput): SlotCandidate[] {
  const zone = rule.timezone || "Europe/Berlin";
  if (jsWeekdayFromYmd(dateYmd, zone) !== rule.weekday) return [];

  const endOfRule = wallOnDate(dateYmd, rule.endTime, zone);
  let cursor = wallOnDate(dateYmd, rule.startTime, zone);
  const out: SlotCandidate[] = [];

  while (cursor.plus({ minutes: rule.slotDurationMinutes }) <= endOfRule) {
    const next = cursor.plus({ minutes: rule.slotDurationMinutes });
    out.push({
      startsAt: cursor.toJSDate(),
      endsAt: next.toJSDate(),
    });
    cursor = next;
  }

  return out;
}

export function mergeRulesForDay(dateYmd: string, rules: RuleInput[]): SlotCandidate[] {
  const merged: SlotCandidate[] = [];
  for (const r of rules) {
    merged.push(...slotsForRuleOnDay(dateYmd, r));
  }
  merged.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return merged;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function slotIsFree(
  slot: SlotCandidate,
  busy: { startsAt: Date; endsAt: Date }[],
): boolean {
  return !busy.some((b) => overlaps(slot.startsAt, slot.endsAt, b.startsAt, b.endsAt));
}

export function eachDateYmdInRange(from: Date, to: Date): string[] {
  let cur = DateTime.fromJSDate(from).startOf("day");
  const end = DateTime.fromJSDate(to).startOf("day");
  const out: string[] = [];
  while (cur <= end) {
    out.push(cur.toFormat("yyyy-MM-dd"));
    cur = cur.plus({ days: 1 });
  }
  return out;
}
