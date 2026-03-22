import type { Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLES: Role[] = ["PATIENT", "DOCTOR", "ADMIN", "NURSE"];

function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

/** Edge-safe role from JWT (use in middleware). Requires NEXTAUTH_SECRET. */
export async function getJwtRole(req: NextRequest): Promise<Role | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const token = await getToken({ req, secret });
  const r = token?.role;
  return isRole(r) ? r : null;
}
