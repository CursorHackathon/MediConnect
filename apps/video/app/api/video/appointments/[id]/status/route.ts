import { NextResponse } from "next/server";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";

import { loadAppointmentForVideo } from "../../../../../../lib/appointment-access";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const gate = await loadAppointmentForVideo(id, user);
  if ("error" in gate) {
    const status = gate.error === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: gate.error }, { status });
  }

  const fresh = await prisma.appointment.findUnique({
    where: { id },
    select: {
      status: true,
      videoRoomUrl: true,
      callStartedAt: true,
      callEndedAt: true,
      postCallNotes: true,
      soapSummary: true,
    },
  });

  return NextResponse.json(fresh);
}
