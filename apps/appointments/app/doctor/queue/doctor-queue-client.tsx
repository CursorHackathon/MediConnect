"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppointmentStatus } from "@prisma/client";
import { localeTag, useTranslation } from "@mediconnect/i18n";
import {
  Badge,
  Button,
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
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  videoRoomUrl: string | null;
  notes: string | null;
  patient: { user: { name: string | null; email: string } };
};

export function DoctorQueueClient() {
  const { t, locale } = useTranslation();
  const loc = localeTag(locale);
  const { data: session } = useSession();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => fetch("/api/v1/doctors").then((r) => r.json()),
    enabled: session?.user?.role === "ADMIN",
  });

  useEffect(() => {
    if (session?.user?.role === "DOCTOR") {
      void fetch("/api/v1/doctors")
        .then((r) => r.json())
        .then((list: { id: string }[]) => setDoctorId(list[0]?.id ?? null));
    }
    if (session?.user?.role === "ADMIN" && doctors?.[0]?.id) {
      setDoctorId((d) => d ?? doctors[0].id);
    }
  }, [session?.user?.role, doctors]);

  const q = useQuery({
    queryKey: ["queue", doctorId],
    queryFn: async () => {
      const url =
        session?.user?.role === "ADMIN" && doctorId
          ? `/api/v1/doctor/queue/today?doctorId=${doctorId}`
          : "/api/v1/doctor/queue/today";
      const r = await fetch(url);
      if (!r.ok) throw new Error("queue");
      return r.json() as Promise<Row[]>;
    },
    enabled: !!doctorId || session?.user?.role === "DOCTOR",
    refetchInterval: 15_000,
  });

  const patch = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const r = await fetch(`/api/v1/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("patch");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });

  const statusLabel = (s: AppointmentStatus) => t(`appt.status.${s}`);

  return (
    <div className="space-y-6">
      <h1 className="font-ether-headline text-3xl font-bold tracking-tight text-blue-800">
        {t("appt.queue.page_title")}
      </h1>

      <section className="ether-glass-panel rounded-3xl border border-white/45 p-6 shadow-[0_24px_60px_rgba(45,47,51,0.08)] md:p-8">
        <div className="mb-6 flex flex-row flex-wrap items-center justify-between gap-4">
          <h2 className="font-ether-headline text-xl font-bold text-ether-on-surface">
            {t("appt.queue.card_title")}
          </h2>
          {session?.user?.role === "ADMIN" && doctors?.length ? (
            <Select value={doctorId ?? ""} onValueChange={setDoctorId}>
              <SelectTrigger className="w-[240px] border-white/40 bg-white/50 backdrop-blur-sm">
                <SelectValue placeholder={t("appt.avail.doctor_select_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d: { id: string; user: { name: string | null } }) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.user.name ?? d.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
        <div className="ether-glass-card rounded-2xl border border-white/35 p-4 md:p-6">
          {q.isLoading ? (
            <p className="text-sm text-ether-on-surface-variant">{t("loading")}</p>
          ) : !q.data?.length ? (
            <p className="py-6 text-center text-sm text-ether-on-surface-variant">{t("appt.queue.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("appt.queue.col_time")}</TableHead>
                  <TableHead>{t("appt.queue.col_patient")}</TableHead>
                  <TableHead>{t("appt.queue.col_status")}</TableHead>
                  <TableHead>{t("appt.queue.col_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {new Date(a.startsAt).toLocaleString(loc)} – {new Date(a.endsAt).toLocaleTimeString(loc)}
                    </TableCell>
                    <TableCell>{a.patient.user.name ?? a.patient.user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{statusLabel(a.status)}</Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {a.videoRoomUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={a.videoRoomUrl} target="_blank" rel="noreferrer">
                            {t("appt.queue.action_call")}
                          </a>
                        </Button>
                      )}
                      {a.status === AppointmentStatus.SCHEDULED && (
                        <Button
                          size="sm"
                          onClick={() =>
                            patch.mutate({ id: a.id, status: AppointmentStatus.IN_PROGRESS })
                          }
                        >
                          {t("appt.queue.action_start")}
                        </Button>
                      )}
                      {a.status === AppointmentStatus.IN_PROGRESS && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            patch.mutate({ id: a.id, status: AppointmentStatus.COMPLETED })
                          }
                        >
                          {t("appt.queue.action_done")}
                        </Button>
                      )}
                      {(a.status === AppointmentStatus.SCHEDULED ||
                        a.status === AppointmentStatus.WAITING) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            patch.mutate({ id: a.id, status: AppointmentStatus.NO_SHOW })
                          }
                        >
                          {t("appt.queue.action_no_show")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  );
}
