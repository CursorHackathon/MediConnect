import { NextRequest, NextResponse } from "next/server";

import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@mediconnect/db";

import { sendReminderEmail } from "@/app/lib/integrations";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const windowStart = new Date(now + 50 * 60 * 1000);
  const windowEnd = new Date(now + 70 * 60 * 1000);

  const due = await prisma.appointment.findMany({
    where: {
      startsAt: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
      status: AppointmentStatus.SCHEDULED,
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });

  let sent = 0;
  for (const appt of due) {
    if (!appt.patient.user || !appt.doctor.user) continue;
    await sendReminderEmail({
      appointment: appt,
      patientEmail: appt.patient.user.email,
      patientName: appt.patient.user.name,
      doctorEmail: appt.doctor.user.email,
      doctorName: appt.doctor.user.name,
    });
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { reminderSentAt: new Date() },
    });
    sent += 1;
  }

  return NextResponse.json({ processed: due.length, remindersSent: sent });
}
