"use client";

import { useQuery } from "@tanstack/react-query";
import { localeTag, useTranslation } from "@mediconnect/i18n";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@mediconnect/ui";

type QueuePayload = {
  appointment: { id: string; startsAt: string; status: string } | null;
  position: number | null;
  estimatedWaitMinutes: number | null;
  canJoin: boolean;
  videoRoomUrl: string | null;
};

export function PatientQueueClient() {
  const { t, locale } = useTranslation();
  const loc = localeTag(locale);

  const q = useQuery({
    queryKey: ["patient-queue"],
    queryFn: () =>
      fetch("/api/v1/patient/queue").then((r) => {
        if (!r.ok) throw new Error("queue");
        return r.json() as Promise<QueuePayload>;
      }),
    refetchInterval: 15_000,
  });

  if (q.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }
  if (q.error || !q.data) {
    return <p className="text-sm text-destructive">{t("appt.patient.queue.error")}</p>;
  }

  const { appointment, position, estimatedWaitMinutes, canJoin, videoRoomUrl } = q.data;

  if (!appointment) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{t("appt.patient.queue.page_title")}</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t("appt.patient.queue.empty")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("appt.patient.queue.page_title")}</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>{t("appt.patient.queue.position_title")}</CardTitle>
          <Badge variant="secondary">#{position}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            {t("appt.patient.queue.start_label")}{" "}
            <span className="font-medium">{new Date(appointment.startsAt).toLocaleString(loc)}</span>
          </p>
          <p className="text-muted-foreground">
            {t("appt.patient.queue.eta", { minutes: estimatedWaitMinutes ?? 0 })}
          </p>
          {canJoin && videoRoomUrl ? (
            <Button asChild>
              <a href={videoRoomUrl} target="_blank" rel="noreferrer">
                {t("appt.patient.queue.video")}
              </a>
            </Button>
          ) : (
            <p className="text-muted-foreground">{t("appt.patient.queue.video_wait")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
