import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { getAuthContext } from "@/app/lib/api-auth";
import { getAvailableSlots } from "@/app/lib/availability-service";

type Ctx = { params: { doctorId: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fromQ = req.nextUrl.searchParams.get("from");
  const toQ = req.nextUrl.searchParams.get("to");
  if (!fromQ || !toQ) {
    return NextResponse.json({ error: "from and to (ISO) required" }, { status: 400 });
  }
  const from = new Date(fromQ);
  const to = new Date(toQ);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  if (auth.role === "ADMIN") {
    // ok
  } else if (auth.role === "PATIENT") {
    const link = await prisma.patientDoctor.findFirst({
      where: { patientId: auth.patientId, doctorId: params.doctorId },
    });
    if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (auth.role === "DOCTOR" && auth.doctorId !== params.doctorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (auth.role === "NURSE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slots = await getAvailableSlots(params.doctorId, from, to);
  return NextResponse.json(slots);
}
