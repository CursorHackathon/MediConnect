import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_CHARS = 3500;

const ELEVEN_BASE = "https://api.elevenlabs.io/v1";

/**
 * Server-side text-to-speech proxy (keeps `ELEVENLABS_API_KEY` off the client).
 */
export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
  if (!apiKey || !voiceId) {
    return NextResponse.json(
      { error: "tts_not_configured", message: "Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => null)) as { text?: unknown } | null;
  const raw = typeof body?.text === "string" ? body.text.trim() : "";
  if (!raw) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  const text = raw.length > MAX_CHARS ? `${raw.slice(0, MAX_CHARS)}…` : raw;

  const modelId = process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";

  const upstream = await fetch(`${ELEVEN_BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => upstream.statusText);
    return NextResponse.json(
      { error: "elevenlabs_failed", message: errText.slice(0, 500), status: upstream.status },
      { status: 502 },
    );
  }

  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
