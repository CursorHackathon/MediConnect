import { AgentDispatchClient } from "livekit-server-sdk";

import { liveKitHttpUrl } from "./livekit-room";

/** Dispatches the LiveKit worker `mediconnect-patient-voice` into the given room. */
export async function dispatchMediconnectPatientVoiceAgent(livekitRoomName: string): Promise<void> {
  const lkUrl = process.env.LIVEKIT_URL;
  const lkKey = process.env.LIVEKIT_API_KEY;
  const lkSecret = process.env.LIVEKIT_API_SECRET;
  if (!livekitRoomName || !lkUrl || !lkKey || !lkSecret) return;
  const client = new AgentDispatchClient(liveKitHttpUrl(lkUrl), lkKey, lkSecret);
  await client.createDispatch(livekitRoomName, "mediconnect-patient-voice");
}
