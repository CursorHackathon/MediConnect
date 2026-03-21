import { AppointmentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { PATIENT_CANCEL_MIN_MS, patientMayCancelAppointment } from "./patient-cancel";

describe("patientMayCancelAppointment", () => {
  it("allows cancel when more than 48h before start and scheduled", () => {
    const startsAt = new Date(Date.now() + PATIENT_CANCEL_MIN_MS + 60_000);
    expect(
      patientMayCancelAppointment({ startsAt, status: AppointmentStatus.SCHEDULED }),
    ).toBe(true);
  });

  it("denies cancel when exactly 48h or less before start", () => {
    const startsAt = new Date(Date.now() + PATIENT_CANCEL_MIN_MS);
    expect(
      patientMayCancelAppointment({ startsAt, status: AppointmentStatus.SCHEDULED }),
    ).toBe(false);
  });

  it("denies cancel for completed or cancelled", () => {
    const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    expect(
      patientMayCancelAppointment({ startsAt, status: AppointmentStatus.COMPLETED }),
    ).toBe(false);
    expect(
      patientMayCancelAppointment({ startsAt, status: AppointmentStatus.CANCELLED }),
    ).toBe(false);
  });
});
