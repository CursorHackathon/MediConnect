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

  const rules = await prisma.doctorAvailabilityRule.findMany({
    where: { doctorId: params.doctorId },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const err = assertStaffDoctor(params.doctorId, auth);
  if (err) return err;
  if (auth.role !== "DOCTOR" && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { weekday, slotDurationMinutes, startTime, endTime, timezone } = body;
  if (
    typeof weekday !== "number" ||
    ![15, 30, 45].includes(Number(slotDurationMinutes)) ||
    typeof startTime !== "string" ||
    typeof endTime !== "string"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const rule = await prisma.doctorAvailabilityRule.create({
    data: {
      doctorId: params.doctorId,
      weekday,
      slotDurationMinutes,
      startTime,
      endTime,
      timezone: typeof timezone === "string" ? timezone : "Europe/Berlin",
    },
  });
  return NextResponse.json(rule, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const err = assertStaffDoctor(params.doctorId, auth);
  if (err) return err;
  if (auth.role !== "DOCTOR" && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ruleId = req.nextUrl.searchParams.get("ruleId");
  if (!ruleId) return NextResponse.json({ error: "ruleId required" }, { status: 400 });

  await prisma.doctorAvailabilityRule.deleteMany({
    where: { id: ruleId, doctorId: params.doctorId },
  });
  return NextResponse.json({ ok: true });
}
