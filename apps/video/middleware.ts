import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSimulatedRoleFromEnv } from "@mediconnect/auth/simulated-role";

function hasRole(role: string, allowed: readonly string[]) {
  return allowed.includes(role);
}

export function middleware(req: NextRequest) {
  const role = getSimulatedRoleFromEnv();
  const path = req.nextUrl.pathname;

  if (path.startsWith("/doctor") && !hasRole(role, ["DOCTOR", "ADMIN"])) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (path.startsWith("/patient") && !hasRole(role, ["PATIENT", "ADMIN"])) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
