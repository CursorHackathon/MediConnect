import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import type { AuthContext } from "@/app/lib/api-auth";
import { getAuthContext } from "@/app/lib/api-auth";

type Ctx = { params: { doctorId: string } };

function assertStaffDoctor(doctorId: string, auth: AuthContext): NextResponse | null {
  if (auth.role === "ADMIN") return null;
  if (auth.role === "DOCTOR" && auth.doctorId === doctorId) return null;
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role === "PATIENT" || auth.role === "NURSE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const err = assertStaffDoctor(params.doctorId, auth);
  if (err) return err;

  const rows = await prisma.availabilityException.findMany({
    where: { doctorId: params.doctorId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role === "PATIENT" || auth.role === "NURSE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const staffErr = assertStaffDoctor(params.doctorId, auth);
  if (staffErr) return staffErr;
  if (auth.role !== "DOCTOR" && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { date, reason } = body;
  if (typeof date !== "string") return NextResponse.json({ error: "date required" }, { status: 400 });

  const d = new Date(`${date}T12:00:00.000Z`);
  const row = await prisma.availabilityException.upsert({
    where: { doctorId_date: { doctorId: params.doctorId, date: d } },
    update: { reason: reason ?? null },
    create: {
      doctorId: params.doctorId,
      date: d,
      reason: reason ?? null,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
