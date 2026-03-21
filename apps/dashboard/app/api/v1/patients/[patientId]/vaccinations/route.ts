import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { authorizePatientAccess } from "@/app/lib/auth-guard";
import { computeVaccinationStatus } from "@/app/lib/utils";

type Ctx = { params: { patientId: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await authorizePatientAccess(params.patientId, [
    "DOCTOR",
    "PATIENT",
    "ADMIN",
  ]);
  if (error) return error;

  const rows = await prisma.vaccination.findMany({
    where: { patientId: params.patientId },
    include: { administeringDoctor: { include: { user: true } } },
    orderBy: { administeredAt: "desc" },
  });

  const withComputedStatus = rows.map((v) => ({
    ...v,
    status: computeVaccinationStatus(v.nextDueDate),
  }));

  return NextResponse.json(withComputedStatus);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error, auth } = await authorizePatientAccess(params.patientId, [
    "DOCTOR",
    "ADMIN",
  ]);
  if (error) return error;

  const body = await req.json();
  const { name, administeredAt, batch, nextDueDate } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const status = computeVaccinationStatus(nextDueDate || null);

  const entry = await prisma.vaccination.create({
    data: {
      patientId: params.patientId,
      name,
      administeredAt: administeredAt ? new Date(administeredAt) : new Date(),
      batch: batch || null,
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      status,
      administeringDoctorId: auth!.doctorRecordId || null,
    },
    include: { administeringDoctor: { include: { user: true } } },
  });

  return NextResponse.json(entry, { status: 201 });
}
