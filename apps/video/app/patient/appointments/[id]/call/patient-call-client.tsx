"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@mediconnect/ui";

type Status = {
  status: string;
  videoRoomUrl: string | null;
  callStartedAt: string | null;
  callEndedAt: string | null;
};

export function PatientCallClient({ appointmentId }: { appointmentId: string }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const res = await fetch(`/api/video/appointments/${appointmentId}/status`);
      if (res.ok && !cancelled) {
        setStatus(await res.json());
      }
    }
    void tick();
    const id = setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [appointmentId]);

  const ready = status?.callStartedAt && status.videoRoomUrl && !status.callEndedAt;
  const ended = !!status?.callEndedAt;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/patient">Back</Link>
        </Button>
        <Badge variant="outline">{status?.status ?? "…"}</Badge>
      </div>

      {!ready && !ended && (
        <Card>
          <CardHeader>
            <CardTitle>Waiting room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Please wait until the doctor has started the call.</p>
            <p className="text-xs">This page refreshes automatically every 3 seconds.</p>
          </CardContent>
        </Card>
      )}

      {ended && (
        <Card>
          <CardHeader>
            <CardTitle>Visit ended</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Thank you. The conversation has ended.</p>
          </CardContent>
        </Card>
      )}

      {ready && status.videoRoomUrl && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Video visit</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <div className="h-[min(60vh,520px)] w-full">
              <iframe
                allow="camera; microphone; fullscreen; display-capture"
                className="h-full w-full rounded-md border bg-black"
                src={status.videoRoomUrl}
                title="Video visit"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
