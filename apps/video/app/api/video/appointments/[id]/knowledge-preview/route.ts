import { NextResponse } from "next/server";

import { getCurrentUser } from "@mediconnect/auth";
import { prisma } from "@mediconnect/db";
import { retrieveHospitalKnowledgeWithFallback } from "@mediconnect/knowledge-base";

import { loadAppointmentForVideo } from "../../../../../../lib/appointment-access";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
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

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ chunks: [], mode: "lexical" as const });
  }

  const { chunks, mode, distances } = await retrieveHospitalKnowledgeWithFallback(prisma, q, 5);

  return NextResponse.json({
    mode,
    chunks: chunks.map((c, i) => ({
      id: c.id,
      source: c.source,
      content: c.content.slice(0, 800),
      score:
        mode === "semantic" && distances && distances[i] !== undefined
          ? Math.max(0, 1 - distances[i]!)
          : undefined,
    })),
  });
}
