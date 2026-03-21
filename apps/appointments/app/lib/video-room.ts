/**
 * Placeholder until Epic E1 (beyondPresence) provides real room URLs.
 */
export function buildVideoRoomUrl(appointmentId: string): string {
  const base = process.env.NEXT_PUBLIC_VIDEO_BASE_URL ?? "https://video.mediconnect.local/room";
  return `${base}/${appointmentId}`;
}
