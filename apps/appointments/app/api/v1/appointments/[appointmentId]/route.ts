import { NextRequest, NextResponse } from "next/server";

import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@mediconnect/db";

import { deleteCalendarOnCancel } from "@/app/lib/integrations";
import { patientMayCancelAppointment } from "@/app/lib/patient-cancel";
import { getAuthContext } from "@/app/lib/api-auth";

type Ctx = { params: { appointmentId: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status } = body as { status?: AppointmentStatus };
  if (!status || !Object.values(AppointmentStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({ where: { id: params.appointmentId } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (auth.role === "PATIENT") {
    if (appt.patientId !== auth.patientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status !== AppointmentStatus.CANCELLED) {
      return NextResponse.json({ error: "Patients may only cancel appointments" }, { status: 403 });
    }
    if (appt.status === AppointmentStatus.CANCELLED) {
      return NextResponse.json({ error: "ALREADY_CANCELLED" }, { status: 400 });
    }
    if (!patientMayCancelAppointment({ startsAt: appt.startsAt, status: appt.status })) {
      return NextResponse.json(
        { error: "CANCEL_TOO_LATE" },
        { status: 403 },
      );
    }
  } else if (auth.role === "DOCTOR") {
    if (auth.doctorId !== appt.doctorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (auth.role === "ADMIN") {
    // ok
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed: AppointmentStatus[] = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.WAITING,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.CANCELLED,
  ];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Status not allowed" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id: params.appointmentId },
    data: { status },
    include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
  });

  if (status === AppointmentStatus.CANCELLED) {
    await deleteCalendarOnCancel(params.appointmentId);
  }

  return NextResponse.json(updated);
}
