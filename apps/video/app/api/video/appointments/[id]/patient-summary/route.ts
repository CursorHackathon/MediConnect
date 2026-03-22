import { NextResponse } from "next/server";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";

import { loadAppointmentForVideo } from "../../../../../../lib/appointment-access";

type Ctx = { params: Promise<{ id: string }> };

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string");
  }
  return [];
}

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const gate = await loadAppointmentForVideo(id, user);
  if ("error" in gate) {
    const status = gate.error === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: gate.error }, { status });
  }

  const patient = await prisma.patient.findUnique({
    where: { id: gate.appointment.patientId },
    include: {
      user: true,
      medications: { orderBy: { createdAt: "desc" }, take: 20 },
      medicalHistories: { orderBy: { diagnosedAt: "desc" }, take: 10 },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    patientName: patient.user.name ?? "Patient",
    allergies: asStringArray(patient.allergies),
    medications: patient.medications.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      prescribedBy: m.prescribedBy,
    })),
    diagnoses: patient.medicalHistories.map((h) => ({
      condition: h.condition,
      icd10Code: h.icd10Code,
      diagnosedAt: h.diagnosedAt,
      notes: h.notes,
    })),
  });
}
