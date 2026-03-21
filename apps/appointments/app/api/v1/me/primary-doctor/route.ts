import { NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { getAuthContext } from "@/app/lib/api-auth";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const link = await prisma.patientDoctor.findFirst({
    where: { patientId: auth.patientId, isPrimary: true },
  });
  return NextResponse.json({ doctorId: link?.doctorId ?? null });
}
