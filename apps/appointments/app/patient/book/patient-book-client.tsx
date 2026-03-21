"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppointmentStatus } from "@prisma/client";
import { localeTag, useTranslation } from "@mediconnect/i18n";
import { patientMayCancelAppointment } from "@/app/lib/patient-cancel";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mediconnect/ui";
import { useMemo, useState } from "react";

type Slot = { startsAt: string; endsAt: string };

type ApptRow = {
  id: string;
  startsAt: string;
  status: AppointmentStatus;
  doctor: { user: { name: string | null } };
};

/** Order rows when showing all statuses: active / upcoming first, then terminal. */
const STATUS_SORT_ORDER: Record<AppointmentStatus, number> = {
  [AppointmentStatus.SCHEDULED]: 0,
  [AppointmentStatus.WAITING]: 1,
  [AppointmentStatus.IN_PROGRESS]: 2,
  [AppointmentStatus.COMPLETED]: 3,
  [AppointmentStatus.NO_SHOW]: 4,
  [AppointmentStatus.CANCELLED]: 5,
};

const STATUS_FILTER_OPTIONS: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.WAITING,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.NO_SHOW,
  AppointmentStatus.CANCELLED,
];

function rangeIsoDays(days: number) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + days);
  return { fromIso: from.toISOString(), toIso: to.toISOString() };
}

function bookingErrorMessage(err: Error, t: (k: string) => string): string {
  const m = err.message;
  if (m === "Maximum two future appointments") return t("appt.patient.book.err_max");
  if (m === "Slot no longer available") return t("appt.patient.book.err_slot");
  if (m === "CANCEL_TOO_LATE") return t("appt.patient.book.err_cancel_late");
  return m || t("appt.patient.book.err_generic");
}

export function PatientBookClient() {
  const { t, locale } = useTranslation();
  const qc = useQueryClient();
  const loc = localeTag(locale);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "ALL">("ALL");

  const primary = useQuery({
    queryKey: ["primary-doctor"],
    queryFn: () => fetch("/api/v1/me/primary-doctor").then((r) => r.json() as Promise<{ doctorId: string | null }>),
  });

  const doctorId = primary.data?.doctorId ?? null;
  const { fromIso, toIso } = useMemo(() => rangeIsoDays(14), []);

  const slots = useQuery({
    queryKey: ["slots", doctorId, fromIso, toIso],
    queryFn: () =>
      fetch(
        `/api/v1/doctors/${doctorId}/slots?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
      ).then((r) => {
        if (!r.ok) throw new Error("slots");
        return r.json() as Promise<Slot[]>;
      }),
    enabled: !!doctorId,
  });

  const appointments = useQuery({
    queryKey: ["appointments"],
    queryFn: () =>
      fetch("/api/v1/appointments").then((r) => {
        if (!r.ok) throw new Error("appointments");
        return r.json() as Promise<ApptRow[]>;
      }),
  });

  const sortedAppointments = useMemo(() => {
    const data = appointments.data ?? [];
    const filtered =
      statusFilter === "ALL" ? data : data.filter((a) => a.status === statusFilter);
    return [...filtered].sort((a, b) => {
      const oa = STATUS_SORT_ORDER[a.status];
      const ob = STATUS_SORT_ORDER[b.status];
      if (oa !== ob) return oa - ob;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });
  }, [appointments.data, statusFilter]);

  const book = useMutation({
    mutationFn: async (slot: Slot) => {
      const r = await fetch("/api/v1/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
        }),
      });
      const data: unknown = await r.json();
      if (!r.ok) {
        const msg =
          data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "book";
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
      void qc.invalidateQueries({ queryKey: ["slots"] });
    },
  });

  const cancel = useMutation({
    mutationFn: async (appointmentId: string) => {
      const r = await fetch(`/api/v1/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: AppointmentStatus.CANCELLED }),
      });
      const data: unknown = await r.json();
      if (!r.ok) {
        const code =
          data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "cancel";
        throw new Error(code);
      }
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
      void qc.invalidateQueries({ queryKey: ["slots"] });
    },
  });

  if (primary.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }
  if (!doctorId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("appt.patient.book.no_primary_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("appt.patient.book.no_primary_body")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("appt.patient.book.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("appt.patient.book.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-dashed bg-muted/30 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t("appt.patient.book.ai_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("appt.patient.book.ai_body")}</p>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{t("appt.patient.book.your_appts")}</CardTitle>
                <p className="text-xs text-muted-foreground">{t("appt.patient.book.cancel_hint")}</p>
              </div>
              <div className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[220px]">
                <span className="text-xs text-muted-foreground">{t("appt.patient.book.filter_status")}</span>
                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v === "ALL" ? "ALL" : (v as AppointmentStatus))
                  }
                >
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("appt.patient.book.filter_all")}</SelectItem>
                    {STATUS_FILTER_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`appt.status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {appointments.isLoading ? (
                <p className="text-muted-foreground">{t("loading")}</p>
              ) : !appointments.data?.length ? (
                <p className="text-muted-foreground">{t("appt.patient.book.no_bookings")}</p>
              ) : !sortedAppointments.length ? (
                <p className="text-muted-foreground">{t("appt.patient.book.no_bookings_filtered")}</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("appt.patient.book.col_datetime")}</TableHead>
                        <TableHead>{t("appt.patient.book.col_doctor")}</TableHead>
                        <TableHead>{t("appt.patient.book.col_status")}</TableHead>
                        <TableHead className="text-right">{t("appt.patient.book.col_actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAppointments.map((a) => {
                        const startsAt = new Date(a.startsAt);
                        const canCancel = patientMayCancelAppointment({
                          startsAt,
                          status: a.status,
                        });
                        const statusLabel = t(`appt.status.${a.status}`);
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="whitespace-nowrap font-medium">
                              {startsAt.toLocaleString(loc)}
                            </TableCell>
                            <TableCell>{a.doctor.user.name ?? t("history.doctor")}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{statusLabel}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {canCancel ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={cancel.isPending}
                                  onClick={() => {
                                    if (
                                      typeof window !== "undefined" &&
                                      window.confirm(t("appt.patient.book.cancel_confirm"))
                                    ) {
                                      cancel.mutate(a.id);
                                    }
                                  }}
                                >
                                  {t("appt.patient.book.cancel")}
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {cancel.isError && (
                <p className="text-sm text-destructive">{bookingErrorMessage(cancel.error as Error, t)}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("appt.patient.book.slots_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {slots.isLoading ? (
                <p className="text-sm text-muted-foreground">{t("appt.patient.book.loading_slots")}</p>
              ) : slots.error ? (
                <p className="text-sm text-destructive">{t("appt.patient.book.slots_error")}</p>
              ) : !slots.data?.length ? (
                <p className="text-sm text-muted-foreground">{t("appt.patient.book.no_slots")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.data.map((s) => (
                    <Button
                      key={`${s.startsAt}-${s.endsAt}`}
                      size="sm"
                      variant="outline"
                      disabled={book.isPending}
                      onClick={() => book.mutate(s)}
                    >
                      {new Date(s.startsAt).toLocaleString(loc, {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Button>
                  ))}
                </div>
              )}
              {book.isError && (
                <p className="mt-2 text-sm text-destructive">
                  {bookingErrorMessage(book.error as Error, t)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
