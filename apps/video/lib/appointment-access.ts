import { prisma } from "@mediconnect/db";

import type { CurrentUser } from "@mediconnect/auth";

export async function loadAppointmentForVideo(appointmentId: string, user: CurrentUser) {
  const apt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });

  if (!apt) {
    return { error: "NOT_FOUND" as const };
  }

  if (user.role === "DOCTOR") {
    if (!apt.doctorId || apt.doctor?.userId !== user.id) {
      return { error: "FORBIDDEN" as const };
    }
  } else if (user.role === "PATIENT") {
    if (apt.patient.userId !== user.id) {
      return { error: "FORBIDDEN" as const };
    }
  } else if (user.role !== "ADMIN") {
    return { error: "FORBIDDEN" as const };
  }

  return { appointment: apt };
}
