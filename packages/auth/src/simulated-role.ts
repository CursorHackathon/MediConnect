/** Matches Prisma `Role` — string-only so Edge middleware can import without Prisma. */
export type SimulatedRole = "PATIENT" | "DOCTOR" | "ADMIN";

export function getSimulatedRoleFromEnv(): SimulatedRole {
  const raw = process.env.SIMULATED_ROLE?.trim().toUpperCase();
  if (raw === "DOCTOR" || raw === "ADMIN" || raw === "PATIENT") {
    return raw;
  }
  return "PATIENT";
}
