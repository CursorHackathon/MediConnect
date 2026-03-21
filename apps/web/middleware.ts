import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import type { Role } from "@mediconnect/db";

function hasRole(tokenRole: unknown, allowed: Role[]) {
  return typeof tokenRole === "string" && allowed.includes(tokenRole as Role);
}

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin") && !hasRole(role, ["ADMIN"])) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (path.startsWith("/doctor") && !hasRole(role, ["DOCTOR", "ADMIN"])) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (path.startsWith("/patient") && !hasRole(role, ["PATIENT", "ADMIN"])) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path === "/" || path.startsWith("/login") || path.startsWith("/api/auth")) {
          return true;
        }
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
