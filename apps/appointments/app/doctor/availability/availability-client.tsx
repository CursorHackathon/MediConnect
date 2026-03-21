"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@mediconnect/i18n";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
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

const WEEKDAY_VALUES = ["0", "1", "2", "3", "4", "5", "6"];

type Rule = {
  id: string;
  weekday: number;
  slotDurationMinutes: number;
  startTime: string;
  endTime: string;
  timezone: string;
};

type Exception = { id: string; date: string; reason: string | null };

export function AvailabilityClient() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [doctorId, setDoctorId] = useState<string | null>(null);

  const [weekday, setWeekday] = useState("1");
  const [duration, setDuration] = useState("30");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [exDate, setExDate] = useState("");
  const [exReason, setExReason] = useState("");

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => fetch("/api/v1/doctors").then((r) => r.json()),
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (session?.user?.role === "DOCTOR" && doctors?.[0]?.id) {
      setDoctorId((d) => d ?? doctors[0].id);
    }
    if (session?.user?.role === "ADMIN" && doctors?.[0]?.id) {
      setDoctorId((d) => d ?? doctors[0].id);
    }
  }, [session?.user?.role, doctors]);

  const rules = useQuery({
    queryKey: ["availability-rules", doctorId],
    queryFn: () =>
      fetch(`/api/v1/doctors/${doctorId}/availability-rules`).then((r) => {
        if (!r.ok) throw new Error("rules");
        return r.json() as Promise<Rule[]>;
      }),
    enabled: !!doctorId,
  });

  const exceptions = useQuery({
    queryKey: ["availability-exceptions", doctorId],
    queryFn: () =>
      fetch(`/api/v1/doctors/${doctorId}/exceptions`).then((r) => {
        if (!r.ok) throw new Error("exceptions");
        return r.json() as Promise<Exception[]>;
      }),
    enabled: !!doctorId,
  });

  const addRule = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/v1/doctors/${doctorId}/availability-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekday: Number(weekday),
          slotDurationMinutes: Number(duration),
          startTime,
          endTime,
          timezone: "Europe/Berlin",
        }),
      });
      if (!r.ok) throw new Error("add");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability-rules"] }),
  });

  const delRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const r = await fetch(
        `/api/v1/doctors/${doctorId}/availability-rules?ruleId=${encodeURIComponent(ruleId)}`,
        { method: "DELETE" },
      );
      if (!r.ok) throw new Error("del");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability-rules"] }),
  });

  const addEx = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/v1/doctors/${doctorId}/exceptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: exDate, reason: exReason || null }),
      });
      if (!r.ok) throw new Error("ex");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability-exceptions"] });
      setExDate("");
      setExReason("");
    },
  });

  if (!doctorId && session?.user?.role === "ADMIN") {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }
  if (!doctorId && session?.user?.role === "DOCTOR") {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("appt.avail.page_title")}</h1>
        <p className="text-sm text-muted-foreground">{t("appt.avail.subtitle")}</p>
      </div>

      {session?.user?.role === "ADMIN" && doctors?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("appt.avail.doctor_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={doctorId ?? ""} onValueChange={setDoctorId}>
              <SelectTrigger className="max-w-sm">
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
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("appt.avail.weekly_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={weekday} onValueChange={setWeekday}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAY_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`appt.weekday.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">{t("appt.avail.min15")}</SelectItem>
                <SelectItem value="30">{t("appt.avail.min30")}</SelectItem>
                <SelectItem value="45">{t("appt.avail.min45")}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="w-[100px]"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="09:00"
            />
            <span className="self-center text-muted-foreground">–</span>
            <Input
              className="w-[100px]"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="12:00"
            />
            <Button onClick={() => addRule.mutate()} disabled={addRule.isPending || !doctorId}>
              {t("appt.avail.add_rule")}
            </Button>
          </div>

          {rules.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("appt.avail.col_day")}</TableHead>
                  <TableHead>{t("appt.avail.col_duration")}</TableHead>
                  <TableHead>{t("appt.avail.col_window")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.data?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{t(`appt.weekday.${r.weekday}`)}</TableCell>
                    <TableCell>{r.slotDurationMinutes} min</TableCell>
                    <TableCell>
                      {r.startTime} – {r.endTime} ({r.timezone})
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => delRule.mutate(r.id)}
                        disabled={delRule.isPending}
                      >
                        {t("appt.avail.delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("appt.avail.exceptions_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} className="max-w-[200px]" />
            <Input
              placeholder={t("appt.avail.reason_placeholder")}
              value={exReason}
              onChange={(e) => setExReason(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={() => addEx.mutate()} disabled={addEx.isPending || !exDate || !doctorId}>
              {t("appt.avail.save")}
            </Button>
          </div>
          {exceptions.data?.length ? (
            <ul className="text-sm text-muted-foreground">
              {exceptions.data.map((ex) => (
                <li key={ex.id}>
                  {ex.date.slice(0, 10)} {ex.reason ? `— ${ex.reason}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("appt.avail.no_exceptions")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
