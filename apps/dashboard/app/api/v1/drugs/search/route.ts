import { NextRequest, NextResponse } from "next/server";

import { getDashboardSession } from "@/app/lib/get-dashboard-session";

export async function GET(req: NextRequest) {
  const session = await getDashboardSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(query)}"&limit=10`,
    );

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    const results = (data.results || []).map((r: Record<string, unknown>) => {
      const openfda = r.openfda as Record<string, string[]> | undefined;
      return {
        name: openfda?.brand_name?.[0] || openfda?.generic_name?.[0] || "Unknown",
        genericName: openfda?.generic_name?.[0] || null,
        route: openfda?.route?.[0] || null,
      };
    });

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
