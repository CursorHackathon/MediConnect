import { AppointmentStatus } from "@prisma/client";

/** Minimum time before start for a patient to self-cancel (48 hours). */
export const PATIENT_CANCEL_MIN_MS = 48 * 60 * 60 * 1000;

const CANCELLABLE: AppointmentStatus[] = [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING];

/**
 * Patient may cancel only future appointments that are strictly more than 48 hours away,
 * and only while still scheduled / waiting (not in progress or terminal states).
 */
export function patientMayCancelAppointment(args: {
  startsAt: Date;
  status: AppointmentStatus;
}): boolean {
  if (!CANCELLABLE.includes(args.status)) return false;
  const msUntil = args.startsAt.getTime() - Date.now();
  return msUntil > PATIENT_CANCEL_MIN_MS;
}
