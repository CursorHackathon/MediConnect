import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { authorizePatientAccess } from "@/app/lib/auth-guard";

type Ctx = { params: { patientId: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await authorizePatientAccess(params.patientId, [
    "DOCTOR",
    "PATIENT",
    "ADMIN",
  ]);
  if (error) return error;

  const records = await prisma.insurance.findMany({
    where: { patientId: params.patientId },
    orderBy: { validTo: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { error } = await authorizePatientAccess(params.patientId, [
    "DOCTOR",
    "ADMIN",
  ]);
  if (error) return error;

  const body = await req.json();
  const {
    providerName,
    policyNumber,
    type,
    coverageTier,
    coPayAmount,
    insurerWebsiteUrl,
    validFrom,
    validTo,
  } = body;

  if (!providerName) {
    return NextResponse.json({ error: "providerName is required" }, { status: 400 });
  }

  const record = await prisma.insurance.create({
    data: {
      patientId: params.patientId,
      providerName,
      policyNumber: policyNumber || null,
      type: type || null,
      coverageTier: coverageTier || null,
      coPayAmount: coPayAmount != null ? parseFloat(coPayAmount) : null,
      insurerWebsiteUrl: insurerWebsiteUrl || null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
    },
  });

  return NextResponse.json(record, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await authorizePatientAccess(params.patientId, [
    "DOCTOR",
    "ADMIN",
  ]);
  if (error) return error;

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.insurance.findFirst({
    where: { id, patientId: params.patientId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  const allowed = [
    "providerName",
    "policyNumber",
    "type",
    "coverageTier",
    "coPayAmount",
    "insurerWebsiteUrl",
    "validFrom",
    "validTo",
  ];

  for (const key of allowed) {
    if (key in updates) {
      if (key === "validFrom" || key === "validTo") {
        data[key] = updates[key] ? new Date(updates[key]) : null;
      } else if (key === "coPayAmount") {
        data[key] = updates[key] != null ? parseFloat(updates[key]) : null;
      } else {
        data[key] = updates[key];
      }
    }
  }

  const updated = await prisma.insurance.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
