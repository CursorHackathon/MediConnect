import type { DoctorAvailabilityRule } from "@prisma/client";
import { AppointmentStatus } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "@mediconnect/db";

import {
  eachDateYmdInRange,
  mergeRulesForDay,
  type RuleInput,
  type SlotCandidate,
  slotIsFree,
} from "./slots";

function toRuleInput(r: DoctorAvailabilityRule): RuleInput {
  return {
    weekday: r.weekday,
    slotDurationMinutes: r.slotDurationMinutes,
    startTime: r.startTime,
    endTime: r.endTime,
    timezone: r.timezone,
  };
}

export async function getAvailableSlots(
  doctorId: string,
  from: Date,
  to: Date,
): Promise<{ startsAt: string; endsAt: string }[]> {
  const fromDay = DateTime.fromJSDate(from).startOf("day").toJSDate();
  const toDay = DateTime.fromJSDate(to).endOf("day").toJSDate();

  const rules = await prisma.doctorAvailabilityRule.findMany({ where: { doctorId } });
  const exceptions = await prisma.availabilityException.findMany({
    where: { doctorId, date: { gte: fromDay, lte: toDay } },
  });
  const blocked = new Set(
    exceptions.map((e) =>
      DateTime.fromJSDate(new Date(e.date)).setZone("Europe/Berlin").toFormat("yyyy-MM-dd"),
    ),
  );

  const busy = await prisma.appointment.findMany({
    where: {
      doctorId,
      startsAt: { gte: fromDay, lte: toDay },
      status: { notIn: [AppointmentStatus.CANCELLED] },
    },
    select: { startsAt: true, endsAt: true },
  });

  const busyRanges = busy.map((b) => ({ startsAt: b.startsAt, endsAt: b.endsAt }));
  const out: SlotCandidate[] = [];

  for (const ymd of eachDateYmdInRange(fromDay, toDay)) {
    if (blocked.has(ymd)) continue;
    const daySlots = mergeRulesForDay(
      ymd,
      rules.map(toRuleInput),
    );
    for (const s of daySlots) {
      if (slotIsFree(s, busyRanges)) out.push(s);
    }
  }

  return out.map((s) => ({
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
  }));
}
