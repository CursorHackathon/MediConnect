import { NextRequest, NextResponse } from "next/server";

import { DateTime } from "luxon";
import { prisma } from "@mediconnect/db";

import { getAuthContext } from "@/app/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== "DOCTOR" && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let doctorId: string | undefined;
  if (auth.role === "ADMIN") {
    doctorId = req.nextUrl.searchParams.get("doctorId") ?? undefined;
    if (!doctorId) {
      return NextResponse.json({ error: "doctorId query required for admin" }, { status: 400 });
    }
  } else if (auth.role === "DOCTOR") {
    doctorId = auth.doctorId;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const start = DateTime.now().setZone("Europe/Berlin").startOf("day").toUTC().toJSDate();
  const end = DateTime.now().setZone("Europe/Berlin").endOf("day").toUTC().toJSDate();

  const rows = await prisma.appointment.findMany({
    where: {
      doctorId,
      startsAt: { gte: start, lte: end },
    },
    include: {
      patient: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(rows);
}
