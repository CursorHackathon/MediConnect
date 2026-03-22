import type { Appointment } from "@prisma/client";

export type BookingNotificationPayload = {
  appointment: Pick<
    Appointment,
    | "id"
    | "startsAt"
    | "endsAt"
    | "videoRoomUrl"
    | "googleCalendarEventIdDoctor"
    | "googleCalendarEventIdPatient"
  >;
  patientEmail: string;
  patientName: string | null;
  doctorEmail: string;
  doctorName: string | null;
};

/**
 * Google Calendar + Gmail: no-op when credentials are missing (local dev).
 * Set GOOGLE_APPLICATION_CREDENTIALS_JSON or implement OAuth for production.
 */
export async function syncCalendarOnBooking(
  payload: BookingNotificationPayload,
): Promise<{ doctorEventId?: string; patientEventId?: string }> {
  if (!process.env.GOOGLE_CALENDAR_ENABLED) {
    console.info(
      "[Calendar] Skipped (GOOGLE_CALENDAR_ENABLED not set):",
      payload.appointment.id,
    );
    return {};
  }
  // Future: create two events via Google Calendar API
  return { doctorEventId: `stub-doc-${payload.appointment.id}`, patientEventId: `stub-pat-${payload.appointment.id}` };
}

export async function deleteCalendarOnCancel(_appointmentId: string): Promise<void> {
  if (!process.env.GOOGLE_CALENDAR_ENABLED) {
    console.info("[Calendar] delete skipped (stub)");
  }
}

export async function sendBookingEmails(payload: BookingNotificationPayload): Promise<void> {
  const subject = `Appointment confirmed — ${payload.doctorName ?? "Doctor"}`;
  const body = `Your appointment at ${payload.appointment.startsAt.toISOString()}\nVideo: ${payload.appointment.videoRoomUrl ?? "—"}\n`;
  if (!process.env.GMAIL_SENDER_EMAIL) {
    console.info("[Email] Would send to", payload.patientEmail, subject, body);
    return;
  }
  console.info("[Email] Stub send to", payload.patientEmail, subject);
}

export async function sendReminderEmail(payload: BookingNotificationPayload): Promise<void> {
  if (!process.env.GMAIL_SENDER_EMAIL) {
    console.info("[Email] Reminder stub for", payload.patientEmail);
    return;
  }
}

export async function sendCancellationEmail(
  payload: BookingNotificationPayload,
): Promise<void> {
  console.info("[Email] Cancellation stub", payload.patientEmail);
}
