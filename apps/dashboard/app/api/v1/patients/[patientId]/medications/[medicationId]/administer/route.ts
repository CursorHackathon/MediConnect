import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { authorizePatientAccess } from "@/app/lib/auth-guard";

type Ctx = { params: { patientId: string; medicationId: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error, auth } = await authorizePatientAccess(params.patientId, [
    "NURSE",
    "DOCTOR",
    "ADMIN",
  ]);
  if (error) return error;

  const med = await prisma.medication.findFirst({
    where: { id: params.medicationId, patientId: params.patientId },
  });

  if (!med) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  const body = await req.json();

  const administration = await prisma.medicationAdministration.create({
    data: {
      medicationId: params.medicationId,
      administeredById: auth!.userId,
      confirmed: true,
      slotLabel: body.slotLabel || null,
    },
  });

  return NextResponse.json(administration, { status: 201 });
}
