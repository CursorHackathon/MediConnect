import { NextResponse } from "next/server";

import { prisma } from "@mediconnect/db";

import { getAuthContext } from "@/app/lib/api-auth";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role === "ADMIN") {
    const rows = await prisma.doctor.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(rows);
  }
  if (auth.role === "DOCTOR") {
    const d = await prisma.doctor.findUnique({
      where: { id: auth.doctorId },
      include: { user: { select: { name: true, email: true } } },
    });
    return NextResponse.json(d ? [d] : []);
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
