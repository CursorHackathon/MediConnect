import type { Role } from "@prisma/client";
import { prisma } from "@mediconnect/db";

import { getSimulatedRoleFromEnv } from "./simulated-role";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Dev/demo: loads a user from the DB using `SIMULATED_USER_ID` or the first user
 * with `SIMULATED_ROLE` (default PATIENT). Seed creates admin@, doctor@, patient@ users.
 */
export async function getCurrentUser() {
  const userId = process.env.SIMULATED_USER_ID?.trim();
  if (userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true, doctor: true },
    });
  }

  const role = getSimulatedRoleFromEnv() as Role;
  return prisma.user.findFirst({
    where: { role },
    include: { patient: true, doctor: true },
  });
}
