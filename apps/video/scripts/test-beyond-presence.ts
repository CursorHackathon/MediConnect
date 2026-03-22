/**
 * Verifies Beyond Presence + LiveKit env by calling the same session flow as patient AI video.
 *
 * From repo root:
 *   pnpm --filter @mediconnect/video test:beyond-presence
 *
 * Loads (in order): monorepo `.env`, then `apps/video/.env.local` if present.
 */
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const videoRoot = resolve(__dirname, "..");
const repoRoot = resolve(videoRoot, "..", "..");

config({ path: resolve(repoRoot, ".env") });
config({ path: resolve(videoRoot, ".env.local") });

async function main() {
  const { createAiAvatarVideoRoom } = await import("../lib/beyond-presence-room");
  const clientSessionId = randomUUID();
  console.log("Testing Beyond Presence (clientSessionId=%s)…\n", clientSessionId);

  const result = await createAiAvatarVideoRoom(clientSessionId);

  if (result.ok) {
    console.log("Success — Beyond Presence returned a join URL.\n");
    console.log("  joinUrl:", result.url);
    console.log("  beyondPresenceSessionId:", result.sessionId);
    console.log("  livekitRoomName:", result.livekitRoomName);
    console.log(
      "\nNext: open /patient/ai-avatar while logged in as a patient, or run the LiveKit agent if you need voice.",
    );
    return;
  }

  console.error("Failed:\n", result.error);
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
