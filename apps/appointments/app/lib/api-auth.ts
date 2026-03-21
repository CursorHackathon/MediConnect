import { getServerSession } from "next-auth/next";

import { authOptions } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";

export type AuthContext =
  | { userId: string; role: "PATIENT"; patientId: string }
  | { userId: string; role: "DOCTOR"; doctorId: string }
  | { userId: string; role: "NURSE" | "ADMIN" };

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) return null;
  const userId = session.user.id;
  const role = session.user.role;

  if (role === "PATIENT") {
    const p = await prisma.patient.findUnique({ where: { userId } });
    if (!p) return null;
    return { userId, role: "PATIENT", patientId: p.id };
  }
  if (role === "DOCTOR") {
    const d = await prisma.doctor.findUnique({ where: { userId } });
    if (!d) return null;
    return { userId, role: "DOCTOR", doctorId: d.id };
  }
  if (role === "NURSE" || role === "ADMIN") {
    return { userId, role };
  }
  return null;
}
