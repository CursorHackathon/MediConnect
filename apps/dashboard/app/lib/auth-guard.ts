import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";

export type AuthContext = {
  userId: string;
  role: string;
  patientRecordId?: string;
  doctorRecordId?: string;
};

/**
 * Verifies the caller has an active session with one of the allowed roles,
 * and—for PATIENT callers—that the requested patientId is their own record.
 */
export async function authorizePatientAccess(
  requestedPatientId: string,
  allowedRoles: string[] = ["DOCTOR", "NURSE", "PATIENT", "ADMIN"],
): Promise<{ error?: NextResponse; auth?: AuthContext }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { id: userId, role } = session.user;

  if (!allowedRoles.includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || patient.id !== requestedPatientId) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { auth: { userId, role, patientRecordId: patient.id } };
  }

  if (role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    return { auth: { userId, role, doctorRecordId: doctor?.id } };
  }

  return { auth: { userId, role } };
}
