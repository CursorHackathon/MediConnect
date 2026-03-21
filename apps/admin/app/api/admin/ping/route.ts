import { NextResponse } from "next/server";

import { requireRole } from "@mediconnect/auth";

export async function GET() {
  const denied = await requireRole("ADMIN");
  if (denied) {
    return denied;
  }
  return NextResponse.json({ ok: true });
}
