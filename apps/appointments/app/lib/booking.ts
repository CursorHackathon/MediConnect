import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@mediconnect/db";

import { sendBookingEmails, syncCalendarOnBooking } from "./integrations";
import { buildVideoRoomUrl } from "./video-room";

const ACTIVE = [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING, AppointmentStatus.IN_PROGRESS];

export async function countFutureActiveBookings(patientId: string): Promise<number> {
  return prisma.appointment.count({
    where: {
      patientId,
      status: { in: ACTIVE },
      endsAt: { gt: new Date() },
    },
  });
}

export async function createBooking(input: {
  patientId: string;
  doctorId: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string | null;
}): Promise<{ id: string }> {
  if (input.endsAt <= input.startsAt) {
    throw new Error("Invalid slot");
  }

  const n = await countFutureActiveBookings(input.patientId);
  if (n >= 2) {
    throw new Error("MAX_TWO_FUTURE");
  }

  const overlap = await prisma.appointment.findFirst({
    where: {
      doctorId: input.doctorId,
      status: { not: AppointmentStatus.CANCELLED },
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
    },
  });
  if (overlap) {
    throw new Error("SLOT_TAKEN");
  }

  const appt = await prisma.$transaction(async (tx) => {
    const created = await tx.appointment.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        status: AppointmentStatus.SCHEDULED,
        notes: input.notes ?? null,
        videoRoomUrl: null,
      },
    });
    const url = buildVideoRoomUrl(created.id);
    return tx.appointment.update({
      where: { id: created.id },
      data: { videoRoomUrl: url },
    });
  });

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
    include: { user: true },
  });
  const doc = await prisma.doctor.findUnique({
    where: { id: input.doctorId },
    include: { user: true },
  });
  if (patient?.user && doc?.user) {
    const cal = await syncCalendarOnBooking({
      appointment: appt,
      patientEmail: patient.user.email,
      patientName: patient.user.name,
      doctorEmail: doc.user.email,
      doctorName: doc.user.name,
    });
    await prisma.appointment.update({
      where: { id: appt.id },
      data: {
        googleCalendarEventIdDoctor: cal.doctorEventId,
        googleCalendarEventIdPatient: cal.patientEventId,
      },
    });
    const latest = await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    await sendBookingEmails({
      appointment: latest,
      patientEmail: patient.user.email,
      patientName: patient.user.name,
      doctorEmail: doc.user.email,
      doctorName: doc.user.name,
    });
  }

  return { id: appt.id };
}
