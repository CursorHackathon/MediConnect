"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import Link from "next/link";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mediconnect/ui";

import { AiAvatarConsultationChrome } from "./ai-avatar-consultation-chrome";

const AiAvatarLiveKitRoom = dynamic(
  () => import("./ai-avatar-livekit-room").then((m) => m.AiAvatarLiveKitRoom),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(70vh,560px)] w-full items-center justify-center rounded-md border border-[#dce4e8] bg-[#0b0f10] text-sm text-[#596064]">
        Preparing connection…
      </div>
    ),
  },
);

type StartResponse = {
  livekitServerUrl?: string;
  livekitToken?: string;
  clientSessionId?: string;
  error?: string;
};

function formatSessionLabel(clientSessionId: string | undefined): string {
  if (!clientSessionId) return "—";
  const compact = clientSessionId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `ID-${compact}`;
}

function PreSessionHeader({ sessionLabel }: { sessionLabel: string }) {
  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between bg-[#f7f9fb] px-8 dark:bg-slate-950">
      <div className="flex items-center gap-4">
        <span className="font-[family-name:var(--font-mc-ai-display),sans-serif] text-lg font-semibold tracking-tight text-[#006a71] dark:text-[#96f1fa]">
          Session
        </span>
        <div className="h-4 w-px bg-[#acb3b7]/30" />
        <span className="text-sm font-medium text-[#596064]">{sessionLabel}</span>
      </div>
      <Button asChild variant="outline" size="sm" className="border-[#006a71]/30 text-[#006a71]">
        <Link href="/patient">Back</Link>
      </Button>
    </header>
  );
}

export function AiAvatarCallClient() {
  const [session, setSession] = useState<{
    serverUrl: string;
    token: string;
    clientSessionId: string;
  } | null>(null);
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
        setError(data?.error ?? `Request failed (${res.status})`);
        return;
      }
      if (data?.livekitServerUrl && data?.livekitToken && data?.clientSessionId) {
        setSession({
          serverUrl: data.livekitServerUrl,
          token: data.livekitToken,
          clientSessionId: data.clientSessionId,
        });
      } else {
        setError("Could not establish a connection. Please try again.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const sessionLabel = formatSessionLabel(session?.clientSessionId);

  return (
    <AiAvatarConsultationChrome>
      {!session ? (
        <>
          <PreSessionHeader sessionLabel="—" />
          <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
            {error && (
              <p className="rounded-md border border-[#a83836]/40 bg-[#fa746f]/15 px-3 py-2 text-sm text-[#67040d] dark:text-[#fa746f]">
                {error}
              </p>
            )}

            <Card className="max-w-2xl border-[#dce4e8] bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-mc-ai-display),sans-serif] text-[#006a71]">
                  AI health coach (video)
                </CardTitle>
                <CardDescription className="text-[#596064]">
                  Talk to our AI — it responds with voice and face. Start the session and allow microphone access when
                  your browser asks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  disabled={loading}
                  onClick={() => void startSession()}
                  className="bg-[#006a71] font-[family-name:var(--font-mc-ai-display),sans-serif] text-[#e7fdff] hover:bg-[#005d63]"
                >
                  {loading ? "Starting…" : "Start video session"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <AiAvatarLiveKitRoom
            serverUrl={session.serverUrl}
            token={session.token}
            sessionIdShort={sessionLabel}
            onDisconnected={endSession}
          />
        </div>
      )}
    </AiAvatarConsultationChrome>
  );
}
