import { NextResponse } from "next/server";

import { AppointmentStatus } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "@mediconnect/db";

import { getAuthContext } from "@/app/lib/api-auth";

const AVG_MINUTES = 20;

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const start = DateTime.now().setZone("Europe/Berlin").startOf("day").toUTC().toJSDate();
  const end = DateTime.now().setZone("Europe/Berlin").endOf("day").toUTC().toJSDate();

  const upcoming = await prisma.appointment.findFirst({
    where: {
      patientId: auth.patientId,
      startsAt: { gte: start, lte: end },
      status: {
        in: [
          AppointmentStatus.SCHEDULED,
          AppointmentStatus.WAITING,
          AppointmentStatus.IN_PROGRESS,
        ],
      },
    },
    orderBy: { startsAt: "asc" },
  });

  if (!upcoming) {
    return NextResponse.json({
      appointment: null,
      position: null,
      estimatedWaitMinutes: null,
      canJoin: false,
    });
  }

  const queue = await prisma.appointment.findMany({
    where: {
      doctorId: upcoming.doctorId,
      startsAt: { gte: start, lte: end },
      status: {
        in: [
          AppointmentStatus.SCHEDULED,
          AppointmentStatus.WAITING,
          AppointmentStatus.IN_PROGRESS,
        ],
      },
    },
    orderBy: { startsAt: "asc" },
  });

  const position = queue.findIndex((a) => a.id === upcoming.id) + 1;
  const estimatedWaitMinutes = Math.max(0, (position - 1) * AVG_MINUTES);
  const canJoin =
    upcoming.status === AppointmentStatus.IN_PROGRESS ||
    (upcoming.status === AppointmentStatus.SCHEDULED && new Date() >= new Date(upcoming.startsAt.getTime() - 5 * 60_000));

  return NextResponse.json({
    appointment: upcoming,
    position,
    estimatedWaitMinutes,
    canJoin,
    videoRoomUrl: upcoming.videoRoomUrl,
  });
}
