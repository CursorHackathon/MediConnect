import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { authorizePatientAccess } from "@/app/lib/auth-guard";

type Ctx = { params: { patientId: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { error } = await authorizePatientAccess(params.patientId, [
    "DOCTOR",
    "PATIENT",
    "ADMIN",
  ]);
  if (error) return error;

  const url = new URL(req.url);
  const visitType = url.searchParams.get("visitType");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: Record<string, unknown> = { patientId: params.patientId };

  if (visitType) where.visitType = visitType;
  if (from || to) {
    where.diagnosedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const entries = await prisma.medicalHistory.findMany({
    where,
    include: {
      attendingDoctor: { include: { user: true } },
      attachments: true,
    },
    orderBy: { diagnosedAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error, auth } = await authorizePatientAccess(params.patientId, [
    "DOCTOR",
    "ADMIN",
  ]);
  if (error) return error;

  const body = await req.json();
  const { condition, icd10Code, icd10Name, visitType, diagnosedAt, notes } = body;

  if (!condition) {
    return NextResponse.json({ error: "condition is required" }, { status: 400 });
  }

  const entry = await prisma.medicalHistory.create({
    data: {
      patientId: params.patientId,
      condition,
      icd10Code: icd10Code || null,
      icd10Name: icd10Name || null,
      visitType: visitType || "DIAGNOSIS",
      attendingDoctorId: auth!.doctorRecordId || null,
      diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : new Date(),
      notes: notes || null,
    },
    include: {
      attendingDoctor: { include: { user: true } },
      attachments: true,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
