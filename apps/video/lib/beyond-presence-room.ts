import {
  iframeSafeJoinUrl,
  liveKitWsUrlForBeyondPresenceApi,
  livekitRoomNameForAiSession,
  livekitRoomNameForAppointment,
  mintLiveKitParticipantToken,
} from "./livekit-room";

export type VideoRoomSuccess = {
  ok: true;
  url: string;
  sessionId: string | null;
  livekitRoomName: string | null;
};

export type VideoRoomFailure = {
  ok: false;
  /** Patient-/doctor-facing message; may include short API detail. */
  error: string;
};

export type VideoRoomResult = VideoRoomSuccess | VideoRoomFailure;

const CONFIG_HINT =
  "Configure the server environment: BEYOND_PRESENCE_API_KEY, BEYOND_PRESENCE_AVATAR_ID, LIVEKIT_URL (e.g. wss://….livekit.cloud), LIVEKIT_API_KEY and LIVEKIT_API_SECRET (or LIVEKIT_TOKEN instead of key/secret).";

function summarizeBeyondPresenceErrorBody(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  try {
    const j = JSON.parse(t) as { detail?: unknown };
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((d: { msg?: string }) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : JSON.stringify(d)))
        .join("; ");
    }
    if (typeof j.detail === "string") return j.detail;
  } catch {
    /* not JSON */
  }
  return t.slice(0, 400);
}

/**
 * Beyond Presence + LiveKit join URL for a fixed `roomName`. No Jitsi fallback — configure BP + LiveKit or the call cannot start.
 */
async function createVideoRoomForLiveKitName(roomName: string): Promise<VideoRoomResult> {
  const base = (process.env.BEYOND_PRESENCE_API_URL ?? "https://api.bey.dev").replace(/\/$/, "");
  const key = process.env.BEYOND_PRESENCE_API_KEY;
  const avatarId = process.env.BEYOND_PRESENCE_AVATAR_ID;
  const livekitUrl = process.env.LIVEKIT_URL?.trim();
  const livekitApiKey = process.env.LIVEKIT_API_KEY;
  const livekitApiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitTokenLegacy = process.env.LIVEKIT_TOKEN;

  /** BP session API requires wss:// (see bey.dev OpenAPI). */
  const livekitUrlForSession = livekitUrl ? liveKitWsUrlForBeyondPresenceApi(livekitUrl) : "";

  const primaryReady = Boolean(key && avatarId && livekitUrl && livekitApiKey && livekitApiSecret);
  const legacyReady = Boolean(key && avatarId && livekitUrl && livekitTokenLegacy);

  let lastSessionError: { status: number; detail: string } | null = null;

  if (primaryReady) {
    try {
      const token = await mintLiveKitParticipantToken({
        apiKey: livekitApiKey!,
        apiSecret: livekitApiSecret!,
        roomName,
        identity: "beyond-presence-bridge",
        name: "Beyond Presence",
      });
      const res = await fetch(`${base}/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key!,
        },
        body: JSON.stringify({
          transport: "livekit",
          avatar_id: avatarId,
          url: livekitUrlForSession,
          token,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { id?: string; url?: string };
        if (data.url) {
          return {
            ok: true,
            url: iframeSafeJoinUrl(data.url),
            sessionId: data.id ?? null,
            livekitRoomName: roomName,
          };
        }
        lastSessionError = { status: 200, detail: "JSON response missing url" };
        if (process.env.NODE_ENV === "development") {
          console.warn("[video] Beyond Presence returned 2xx but JSON had no url:", data);
        }
      } else {
        const errBody = await res.text().catch(() => "");
        lastSessionError = { status: res.status, detail: errBody.slice(0, 800) };
        if (process.env.NODE_ENV === "development") {
          console.warn("[video] Beyond Presence POST /v1/sessions failed:", res.status, errBody.slice(0, 600));
        }
      }
    } catch (e) {
      lastSessionError = { status: 0, detail: String(e) };
      if (process.env.NODE_ENV === "development") {
        console.warn("[video] Beyond Presence session request threw:", e);
      }
    }
  } else if (process.env.NODE_ENV === "development") {
    const missing: string[] = [];
    if (!key) missing.push("BEYOND_PRESENCE_API_KEY");
    if (!avatarId) missing.push("BEYOND_PRESENCE_AVATAR_ID");
    if (!livekitUrl) missing.push("LIVEKIT_URL");
    if (!livekitApiKey || !livekitApiSecret) missing.push("LIVEKIT_API_KEY + LIVEKIT_API_SECRET");
    if (missing.length) {
      console.warn("[video] Primary Beyond Presence path skipped (missing env):", missing.join(", "));
    }
  }

  if (legacyReady) {
    try {
      const res = await fetch(`${base}/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key!,
        },
        body: JSON.stringify({
          transport: "livekit",
          avatar_id: avatarId,
          url: livekitUrlForSession,
          token: livekitTokenLegacy,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { id?: string; url?: string };
        if (data.url) {
          return {
            ok: true,
            url: iframeSafeJoinUrl(data.url),
            sessionId: data.id ?? null,
            livekitRoomName: roomName,
          };
        }
        lastSessionError = { status: 200, detail: "JSON ohne url (legacy)" };
        if (process.env.NODE_ENV === "development") {
          console.warn("[video] Beyond Presence (legacy) returned 2xx but JSON had no url:", data);
        }
      } else {
        const errBody = await res.text().catch(() => "");
        lastSessionError = { status: res.status, detail: errBody.slice(0, 800) };
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[video] Beyond Presence (legacy token) /v1/sessions failed:",
            res.status,
            errBody.slice(0, 600),
          );
        }
      }
    } catch (e) {
      lastSessionError = { status: 0, detail: String(e) };
      if (process.env.NODE_ENV === "development") {
        console.warn("[video] Beyond Presence legacy session threw:", e);
      }
    }
  }

  if (!primaryReady && !legacyReady) {
    return {
      ok: false,
      error: `Beyond Presence is not configured. ${CONFIG_HINT}`,
    };
  }

  if (lastSessionError?.status === 200) {
    return {
      ok: false,
      error:
        "Beyond Presence responded but did not return a video URL. Check avatar ID and LiveKit URL in server configuration and the API response in server logs.",
    };
  }

  if (lastSessionError && lastSessionError.status > 0) {
    const apiHint = summarizeBeyondPresenceErrorBody(lastSessionError.detail);
    return {
      ok: false,
      error: `Beyond Presence session failed (HTTP ${lastSessionError.status}).${apiHint ? ` ${apiHint}` : ""} ${CONFIG_HINT}`,
    };
  }

  return {
    ok: false,
    error: `Beyond Presence session could not be created (network or server error). ${CONFIG_HINT}`,
  };
}

/**
 * Doctor appointment video room (legacy). Voice agent is **not** auto-dispatched here — use patient AI avatar flow.
 */
export async function createVideoRoom(appointmentId: string): Promise<VideoRoomResult> {
  const roomName = livekitRoomNameForAppointment(appointmentId);
  return createVideoRoomForLiveKitName(roomName);
}

/**
 * Patient ↔ AI avatar session: unique LiveKit room per `clientSessionId` (e.g. UUID).
 * Caller should dispatch `mediconnect-patient-voice` when `livekitRoomName` is set.
 */
export async function createAiAvatarVideoRoom(clientSessionId: string): Promise<VideoRoomResult> {
  const roomName = livekitRoomNameForAiSession(clientSessionId);
  return createVideoRoomForLiveKitName(roomName);
}
