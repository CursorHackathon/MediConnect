import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { authorizePatientAccess } from "@/app/lib/auth-guard";

type Ctx = { params: { patientId: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await authorizePatientAccess(params.patientId, [
    "DOCTOR",
    "NURSE",
    "PATIENT",
    "ADMIN",
  ]);
  if (error) return error;

  const now = new Date();

  await prisma.medication.updateMany({
    where: {
      patientId: params.patientId,
      isActive: true,
      endDate: { lt: now },
    },
    data: { isActive: false },
  });

  const medications = await prisma.medication.findMany({
    where: { patientId: params.patientId },
    include: {
      prescribedBy: { include: { user: true } },
      administrations: { orderBy: { administeredAt: "desc" }, take: 10 },
    },
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
  });

  return NextResponse.json(medications);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error, auth } = await authorizePatientAccess(params.patientId, [
    "DOCTOR",
    "ADMIN",
  ]);
  if (error) return error;

  const body = await req.json();
  const { name, dosage, frequency, route, startDate, endDate } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const med = await prisma.medication.create({
    data: {
      patientId: params.patientId,
      name,
      dosage: dosage || null,
      frequency: frequency || null,
      route: route || null,
      prescribedById: auth!.doctorRecordId || null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      isActive: true,
    },
    include: {
      prescribedBy: { include: { user: true } },
      administrations: true,
    },
  });

  return NextResponse.json(med, { status: 201 });
}
