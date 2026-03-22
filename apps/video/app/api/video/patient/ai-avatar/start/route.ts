import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { TrackSource } from "livekit-server-sdk";

import { getCurrentUser } from "@mediconnect/auth";

import { dispatchMediconnectPatientVoiceAgent } from "../../../../../../lib/dispatch-patient-voice-agent";
import {
  liveKitWsUrlForBeyondPresenceApi,
  livekitRoomNameForAiSession,
  mintLiveKitParticipantToken,
} from "../../../../../../lib/livekit-room";

/**
 * Starts a patient AI avatar session.
 * Creates a LiveKit room, mints a patient token, and dispatches the voice agent.
 * The agent itself handles the Beyond Presence avatar via @livekit/agents-plugin-bey.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lkUrl = process.env.LIVEKIT_URL?.trim();
  const lkKey = process.env.LIVEKIT_API_KEY;
  const lkSecret = process.env.LIVEKIT_API_SECRET;

  if (!lkUrl || !lkKey || !lkSecret) {
    return NextResponse.json(
      {
        error: "Video consultation is temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    );
  }

  const clientSessionId = randomUUID();
  const livekitRoomName = livekitRoomNameForAiSession(clientSessionId);

  try {
    await dispatchMediconnectPatientVoiceAgent(livekitRoomName);
  } catch (e) {
    console.error("[video] AI avatar agent dispatch failed:", e);
    return NextResponse.json(
      { error: "The assistant is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  let livekitServerUrl: string;
  let livekitToken: string;
  try {
    livekitServerUrl = liveKitWsUrlForBeyondPresenceApi(lkUrl);
    livekitToken = await mintLiveKitParticipantToken({
      apiKey: lkKey,
      apiSecret: lkSecret,
      roomName: livekitRoomName,
      identity: `patient-${user.id}`,
      name: user.name ?? user.email,
      canPublishSources: [TrackSource.MICROPHONE],
    });
  } catch (e) {
    console.error("[video] Patient LiveKit token mint failed:", e);
    return NextResponse.json(
      { error: "The session could not be started. Please try again." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    livekitServerUrl,
    livekitToken,
    clientSessionId,
    livekitRoomName,
  });
}
