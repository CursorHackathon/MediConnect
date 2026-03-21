import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import type { Role } from "@prisma/client";

import { authOptions } from "./auth-options";

/**
 * Ensures the current session user has one of the allowed roles.
 * Returns a `NextResponse` with 401/403 for route handlers, or `null` when authorized.
 */
export async function requireRole(allowed: Role | Role[]): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  const roles = Array.isArray(allowed) ? allowed : [allowed];

  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!roles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
