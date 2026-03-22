import { AccessToken, TrackSource } from "livekit-server-sdk";

/** Stable LiveKit room name for an appointment (must match JWT grants for BP + agent). */
export function livekitRoomNameForAppointment(appointmentId: string): string {
  const safe = appointmentId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 56);
  return `mc-${safe || "room"}`;
}

/** Room name for patient ↔ AI avatar sessions (no doctor appointment). */
export function livekitRoomNameForAiSession(sessionId: string): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 48);
  return `mc-ai-${safe || "session"}`;
}

/** AgentDispatchClient and RoomService expect https host, not wss. */
export function liveKitHttpUrl(livekitUrl: string): string {
  const u = livekitUrl.trim();
  if (u.startsWith("wss://")) return `https://${u.slice(6)}`;
  if (u.startsWith("ws://")) return `http://${u.slice(5)}`;
  return u;
}

/**
 * Beyond Presence `POST /v1/sessions` expects the LiveKit **WebSocket** URL (`wss://…`), not https.
 * @see https://docs.bey.dev/api-reference/sessions/create-speech-to-video-session
 */
export function liveKitWsUrlForBeyondPresenceApi(livekitUrl: string): string {
  const u = livekitUrl.trim();
  if (u.startsWith("wss://") || u.startsWith("ws://")) return u;
  if (u.startsWith("https://")) return `wss://${u.slice(8)}`;
  if (u.startsWith("http://")) return `ws://${u.slice(7)}`;
  return u;
}

/**
 * Iframe `src` must be http(s): never wss/ws (those are WebSocket endpoints, not web pages).
 * Beyond Presence sometimes echoes LiveKit’s wss URL as `session.url` if the session request used wss.
 */
export function iframeSafeJoinUrl(url: string): string {
  const u = url.trim();
  if (u.startsWith("wss://")) return `https://${u.slice(6)}`;
  if (u.startsWith("ws://")) return `http://${u.slice(5)}`;
  return u;
}

export async function mintLiveKitParticipantToken(opts: {
  apiKey: string;
  apiSecret: string;
  roomName: string;
  identity: string;
  name?: string;
  ttl?: string | number;
  canPublish?: boolean;
  canPublishSources?: TrackSource[];
}): Promise<string> {
  const at = new AccessToken(opts.apiKey, opts.apiSecret, {
    identity: opts.identity,
    name: opts.name,
    ttl: opts.ttl ?? "4h",
  });
  at.addGrant({
    room: opts.roomName,
    roomJoin: true,
    canPublish: opts.canPublish ?? true,
    canSubscribe: true,
    canPublishData: true,
    ...(opts.canPublishSources ? { canPublishSources: opts.canPublishSources } : {}),
  });
  return at.toJwt();
}
