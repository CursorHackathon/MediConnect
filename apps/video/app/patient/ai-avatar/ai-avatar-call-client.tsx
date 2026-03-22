"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import Link from "next/link";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mediconnect/ui";

const AiAvatarLiveKitRoom = dynamic(
  () => import("./ai-avatar-livekit-room").then((m) => m.AiAvatarLiveKitRoom),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(70vh,560px)] w-full items-center justify-center rounded-md border bg-black text-sm text-muted-foreground">
        Verbindung wird vorbereitet…
      </div>
    ),
  },
);

type StartResponse = {
  livekitServerUrl?: string;
  livekitToken?: string;
  error?: string;
};

export function AiAvatarCallClient() {
  const [session, setSession] = useState<{ serverUrl: string; token: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endSession = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/video/patient/ai-avatar/start", { method: "POST" });
      const data = (await res.json().catch(() => null)) as StartResponse | null;
      if (!res.ok) {
        setError(data?.error ?? `Anfrage fehlgeschlagen (${res.status})`);
        return;
      }
      if (data?.livekitServerUrl && data?.livekitToken) {
        setSession({ serverUrl: data.livekitServerUrl, token: data.livekitToken });
      } else {
        setError("Keine LiveKit-Verbindungsdaten erhalten.");
      }
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/patient">Zurück</Link>
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!session && (
        <Card>
          <CardHeader>
            <CardTitle>KI-Gesundheitscoach (Video)</CardTitle>
            <CardDescription>
              Sprechen Sie mit unserer KI — der Beyond-Presence-Avatar antwortet Ihnen mit Stimme und Gesicht.
              Starten Sie die Sitzung und erlauben Sie den Mikrofonzugriff, wenn der Browser danach fragt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled={loading} onClick={() => void startSession()}>
              {loading ? "Wird gestartet…" : "Video-Sitzung starten"}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Ohne gültige Beyond-Presence- und LiveKit-Konfiguration startet keine Sitzung. Der Worker{" "}
              <code className="rounded bg-muted px-1">pnpm livekit:patient-agent</code> muss laufen; in der Server-
              <code className="rounded bg-muted px-1">.env</code> brauchen Sie u. a.{" "}
              <code className="rounded bg-muted px-1">BEYOND_PRESENCE_API_KEY</code>,{" "}
              <code className="rounded bg-muted px-1">BEYOND_PRESENCE_AVATAR_ID</code>,{" "}
              <code className="rounded bg-muted px-1">LIVEKIT_URL</code>,{" "}
              <code className="rounded bg-muted px-1">LIVEKIT_API_KEY</code> und{" "}
              <code className="rounded bg-muted px-1">LIVEKIT_API_SECRET</code>.
            </p>
          </CardContent>
        </Card>
      )}

      {session && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ihre Video-Sitzung</CardTitle>
            <CardDescription>Beenden Sie die Sitzung hier, wenn Sie fertig sind.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-2 pt-0">
            <div className="h-[min(70vh,560px)] w-full overflow-hidden rounded-md border bg-black">
              <AiAvatarLiveKitRoom
                serverUrl={session.serverUrl}
                token={session.token}
                onDisconnected={endSession}
              />
            </div>
            <Button variant="secondary" onClick={endSession}>
              Sitzung beenden
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
