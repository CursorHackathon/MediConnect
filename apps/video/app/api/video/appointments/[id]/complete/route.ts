import { NextResponse } from "next/server";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";

import { loadAppointmentForVideo } from "../../../../../../lib/appointment-access";
import { generateSoapDeutsch } from "../../../../../../lib/soap-generate";
import { AppointmentStatus } from "../../../../../../lib/statuses";

type Ctx = { params: Promise<{ id: string }> };

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string");
  }
  return [];
}

export async function POST(req: Request, ctx: Ctx) {
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

  const body = (await req.json()) as { postCallNotes?: string; generateSoap?: boolean };
  const postCallNotes = typeof body.postCallNotes === "string" ? body.postCallNotes : "";
  const generateSoap = body.generateSoap !== false;

  const patient = await prisma.patient.findUnique({
    where: { id: gate.appointment.patientId },
    include: {
      user: true,
      medications: { orderBy: { createdAt: "desc" }, take: 20 },
      medicalHistories: { orderBy: { diagnosedAt: "desc" }, take: 10 },
    },
  });

  let soapSummary: string | null = null;
  let soapStructured: object | null = null;

  if (generateSoap && patient) {
    const soap = await generateSoapDeutsch({
      patientName: patient.user.name ?? "Patient",
      allergies: asStringArray(patient.allergies),
      medications: patient.medications.map((m) =>
        [m.name, m.dosage, m.frequency].filter(Boolean).join(" "),
      ),
      diagnoses: patient.medicalHistories.map((h) => h.condition),
      postCallNotes,
    });
    soapSummary = soap.summary;
    soapStructured = soap.structured;
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      callEndedAt: new Date(),
      status: AppointmentStatus.COMPLETED,
      postCallNotes,
      soapSummary,
      soapStructured: soapStructured === null ? undefined : soapStructured,
    },
    select: {
      status: true,
      callEndedAt: true,
      postCallNotes: true,
      soapSummary: true,
      soapStructured: true,
    },
  });

  return NextResponse.json(updated);
}
