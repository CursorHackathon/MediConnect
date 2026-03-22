import { NextResponse } from "next/server";

import { requireRole } from "@mediconnect/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireRole("ADMIN");
  if (denied) {
    return denied;
  }
  return NextResponse.json({ ok: true });
}
