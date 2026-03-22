/** Mirrors Prisma `AppointmentStatus` — use `IN_PROGRESS` when the video visit is active. */
export const AppointmentStatus = {
  SCHEDULED: "SCHEDULED",
  WAITING: "WAITING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
  CANCELLED: "CANCELLED",
} as const;

export type AppointmentStatusValue = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];
