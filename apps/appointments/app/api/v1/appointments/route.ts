import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { getAuthContext } from "@/app/lib/api-auth";
import { createBooking } from "@/app/lib/booking";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.appointment.findMany({
    where: { patientId: auth.patientId },
    include: {
      doctor: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { startsAt: "asc" },
    take: 50,
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { doctorId, startsAt, endsAt, notes } = body;
  if (typeof doctorId !== "string" || typeof startsAt !== "string" || typeof endsAt !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const link = await prisma.patientDoctor.findFirst({
    where: { patientId: auth.patientId, doctorId },
  });
  if (!link) {
    return NextResponse.json({ error: "Not assigned to this doctor" }, { status: 403 });
  }

  try {
    const { id } = await createBooking({
      patientId: auth.patientId,
      doctorId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      notes: notes ?? null,
    });
    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } } },
    });
    return NextResponse.json(appt, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "MAX_TWO_FUTURE") {
      return NextResponse.json({ error: "Maximum two future appointments" }, { status: 409 });
    }
    if (msg === "SLOT_TAKEN") {
      return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
    }
    throw e;
  }
}
