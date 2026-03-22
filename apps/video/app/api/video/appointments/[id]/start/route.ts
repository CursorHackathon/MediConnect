import { NextResponse } from "next/server";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";

import { loadAppointmentForVideo } from "../../../../../../lib/appointment-access";
import { createVideoRoom } from "../../../../../../lib/beyond-presence-room";
import { AppointmentStatus } from "../../../../../../lib/statuses";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const gate = await loadAppointmentForVideo(id, user);
  if ("error" in gate) {
    const status = gate.error === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: gate.error }, { status });
  }

  const roomResult = await createVideoRoom(id);
  if (!roomResult.ok) {
    return NextResponse.json({ error: roomResult.error }, { status: 503 });
  }

  const { url, sessionId } = roomResult;

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      videoRoomUrl: url,
      videoSessionId: sessionId,
      callStartedAt: new Date(),
      status: AppointmentStatus.IN_CALL,
    },
    select: {
      videoRoomUrl: true,
      videoSessionId: true,
      callStartedAt: true,
      status: true,
    },
  });

  return NextResponse.json(updated);
}
