export const AppointmentStatus = {
  SCHEDULED: "SCHEDULED",
  WAITING: "WAITING",
  IN_CALL: "IN_CALL",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type AppointmentStatusValue = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];
