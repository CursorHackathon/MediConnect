import { NextResponse } from "next/server";

import { getDashboardSession } from "@/app/lib/get-dashboard-session";
import { prisma } from "@mediconnect/db";

export async function GET() {
  const session = await getDashboardSession();

  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = session.user;

  if (!["DOCTOR", "NURSE", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const patients = await prisma.patient.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(patients);
}
