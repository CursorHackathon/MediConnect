import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const role = req.nextauth.token?.role;
    if (path.startsWith("/doctor")) {
      if (role !== "DOCTOR" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    if (path.startsWith("/patient")) {
      if (role !== "PATIENT") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/api/auth")) return true;
        if (path.startsWith("/api/cron")) return true;
        if (path.startsWith("/api/v1/")) return true;
        if (path === "/login") return true;
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
