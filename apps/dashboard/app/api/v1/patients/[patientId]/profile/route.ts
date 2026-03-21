import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { authorizePatientAccess } from "@/app/lib/auth-guard";

type Ctx = { params: { patientId: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error, auth } = await authorizePatientAccess(params.patientId);
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    include: { user: true },
  });

  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(patient);
}

const EDITABLE_FIELDS = [
  "gender",
  "bloodType",
  "allergies",
  "preferredLanguage",
  "emergencyContactName",
  "emergencyContactPhone",
  "dob",
  "phone",
] as const;

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error, auth } = await authorizePatientAccess(params.patientId, [
    "PATIENT",
    "DOCTOR",
    "ADMIN",
  ]);
  if (error) return error;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  if (data.dob && typeof data.dob === "string") {
    data.dob = new Date(data.dob as string);
  }

  const updated = await prisma.patient.update({
    where: { id: params.patientId },
    data,
    include: { user: true },
  });

  return NextResponse.json(updated);
}
