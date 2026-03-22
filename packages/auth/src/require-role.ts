import type { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "./get-current-user";

/**
 * Ensures the simulated user has one of the allowed roles.
 * Returns a `NextResponse` with 401/403 for route handlers, or `null` when authorized.
 */
export async function requireRole(allowed: Role | Role[]): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  const roles = Array.isArray(allowed) ? allowed : [allowed];

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
