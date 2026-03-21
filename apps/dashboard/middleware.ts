import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    if (typeof role !== "string") {
      return NextResponse.redirect(new URL("/api/auth/signin", req.url));
    }

    const allowed = ["PATIENT", "DOCTOR", "NURSE", "ADMIN"];
    if (!allowed.includes(role)) {
      return NextResponse.redirect(new URL("/api/auth/signin", req.url));
    }

    if (path.startsWith("/patients") && role === "PATIENT") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/api/auth")) return true;
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|login).*)"],
};
