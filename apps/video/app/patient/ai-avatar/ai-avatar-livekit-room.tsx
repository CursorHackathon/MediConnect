"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
  useTranscriptions,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import { useMemo } from "react";

import { Button, cn } from "@mediconnect/ui";
import { Bell, Mic, MicOff, UserCircle } from "lucide-react";

import { PrivacyTrustCard } from "./ai-avatar-consultation-chrome";

const LEGACY_AVATAR_IDENTITY = "bey-avatar-agent";

type Props = {
  serverUrl: string;
  token: string;
  sessionIdShort: string;
  onDisconnected?: () => void;
};

function SessionHeader({ sessionIdShort }: { sessionIdShort: string }) {
  const room = useRoomContext();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full max-w-full shrink-0 items-center justify-between bg-[#f7f9fb] px-8 dark:bg-slate-950">
      <div className="flex items-center gap-4">
        <span className="font-[family-name:var(--font-mc-ai-display),sans-serif] text-lg font-semibold tracking-tight text-[#006a71] dark:text-[#96f1fa]">
          Session
        </span>
        <div className="h-4 w-px bg-[#acb3b7]/30" />
        <span className="text-sm font-medium text-[#596064]">{sessionIdShort}</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full p-2 text-[#596064] transition-colors hover:bg-[#f0f4f7] dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-[#596064] transition-colors hover:bg-[#f0f4f7] dark:hover:bg-slate-800"
            aria-label="Account"
          >
            <UserCircle aria-hidden className="size-5" />
          </button>
        </div>
        <Button
          type="button"
          className="rounded-lg bg-[#a83836] px-6 py-2 font-[family-name:var(--font-mc-ai-display),sans-serif] text-sm font-semibold text-[#fff7f6] hover:opacity-90"
          onClick={() => void room.disconnect()}
        >
          Sitzung beenden
        </Button>
      </div>
    </header>
  );
}

function useListeningLabel(
  agentState: string,
  micEnabled: boolean,
): { label: string; active: boolean } {
  if (!micEnabled) {
    return { label: "Mic muted", active: false };
  }
  if (agentState === "speaking") {
    return { label: "Assistant speaking…", active: false };
  }
  if (agentState === "thinking") {
    return { label: "Thinking…", active: true };
  }
  if (agentState === "connecting" || agentState === "pre-connect-buffering" || agentState === "initializing") {
    return { label: "Connecting…", active: true };
  }
  return { label: "Listening…", active: true };
}

function AvatarVideoPane({ className }: { className?: string }) {
  const connectionState = useConnectionState();
  const { videoTrack: agentVideo } = useVoiceAssistant();
  const remoteParticipants = useRemoteParticipants();
  const allVideoTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: true,
  });

  const legacyParticipant = remoteParticipants.find((p) => p.identity === LEGACY_AVATAR_IDENTITY);
  const legacyTrack = allVideoTracks.find((t) => t.participant.identity === LEGACY_AVATAR_IDENTITY);

  if (connectionState === ConnectionState.Connecting) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-[#596064]">
        Connecting…
      </div>
    );
  }

  if (agentVideo) {
    return <VideoTrack trackRef={agentVideo} className={className} />;
  }

  if (!legacyParticipant) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-[#596064]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#596064] border-t-transparent" />
        <p>Warte auf Avatar…</p>
        <p className="max-w-xs text-center text-xs opacity-60">
          Der Beyond-Presence-Avatar tritt dem Raum bei.
        </p>
      </div>
    );
  }

  if (!legacyTrack) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-[#596064]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#596064] border-t-transparent" />
        <p>Avatar connected — waiting for video…</p>
      </div>
    );
  }

  return <VideoTrack trackRef={legacyTrack} className={className} />;
}

function TranscriptionPanel() {
  const { agentTranscriptions, state: agentState } = useVoiceAssistant();
  const transcriptions = useTranscriptions();
  const { localParticipant } = useLocalParticipant();
  const localId = localParticipant.identity;

  const lines = useMemo(() => {
    const assistantText = agentTranscriptions
      .map((s) => ("text" in s ? String((s as { text?: string }).text ?? "") : ""))
      .map((t) => t.trim())
      .filter(Boolean)
      .at(-1);

    const userSnippet = [...transcriptions]
      .reverse()
      .find((t) => {
        const id = (t as { participantInfo?: { identity?: string } }).participantInfo?.identity;
        return id === localId;
      });
    const userText =
      userSnippet && "text" in userSnippet
        ? String((userSnippet as { text?: string }).text ?? "").trim()
        : "";

    const out: { kind: "meta" | "user" | "assistant"; text: string }[] = [
      {
        kind: "meta",
        text: "Hier erscheinen Ihre gesprochenen Worte und die Antworten des Assistenten.",
      },
    ];
    if (userText) {
      out.push({ kind: "user", text: userText });
    }
    if (assistantText) {
      out.push({ kind: "assistant", text: assistantText });
    } else if (agentState === "listening" && !userText) {
      out.push({
        kind: "assistant",
        text: "You can speak now. I’m listening through your microphone.",
      });
    }
    return out;
  }, [agentTranscriptions, transcriptions, localId, agentState]);

  return (
    <div className="pointer-events-none w-full max-w-full">
      <div className="mc-ai-glass mc-ai-scrollbar pointer-events-auto max-h-[min(42vh,320px)] w-full overflow-y-auto rounded-2xl border border-white/20 p-4 shadow-sm sm:max-h-[min(48vh,380px)] sm:p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="size-2 shrink-0 animate-pulse rounded-full bg-[#006a71]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#596064]">
            Live transcription
          </span>
        </div>
        <div className="space-y-2.5 pr-1">
          {lines.map((line, i) => (
            <p
              key={`${line.kind}-${i}`}
              className={cn(
                "leading-snug",
                line.kind === "meta" && "text-[11px] italic leading-snug text-[#596064]/85",
                line.kind === "user" && "text-sm font-medium text-[#2c3437] sm:text-base",
                line.kind === "assistant" && "text-sm font-medium text-[#2c3437] sm:text-base",
              )}
            >
              {line.kind === "assistant" ? `„${line.text}”` : line.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function VoiceAndCardsRow() {
  const { state: agentState } = useVoiceAssistant();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const { label, active } = useListeningLabel(agentState, isMicrophoneEnabled);

  function toggleMicrophone() {
    void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }

  return (
    <div className="pointer-events-none flex flex-1 items-end justify-between gap-6 p-6 sm:p-10">
      <div className="pointer-events-auto flex flex-col items-center gap-4">
        <button
          type="button"
          className="relative flex size-24 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#006a71] focus-visible:ring-offset-2"
          onClick={toggleMicrophone}
          aria-pressed={isMicrophoneEnabled}
          aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {active ? (
            <div className="mc-ai-voice-pulse pointer-events-none absolute inset-0 rounded-full bg-[#006a71]/10" />
          ) : null}
          <div
            className={cn(
              "pointer-events-none absolute inset-2 rounded-full bg-[#006a71]/20",
              active && "animate-pulse",
            )}
          />
          <div className="relative z-10 flex size-16 items-center justify-center rounded-full bg-[#006a71] shadow-lg">
            {isMicrophoneEnabled ? (
              <Mic aria-hidden className="size-8 text-white" />
            ) : (
              <MicOff aria-hidden className="size-8 text-white" />
            )}
          </div>
        </button>
        <span
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-bold backdrop-blur-md",
            active
              ? "bg-[#96f1fa]/80 text-[#006a71]"
              : "bg-[#eaeff2] text-[#596064]",
          )}
        >
          {label}
        </span>
      </div>
      <div className="grid w-72 max-w-[min(100%,18rem)] grid-cols-1 gap-3 sm:gap-4">
        <TranscriptionPanel />
        <PrivacyTrustCard />
      </div>
    </div>
  );
}

function SessionStage({ sessionIdShort }: { sessionIdShort: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f0f4f7] dark:bg-slate-900">
      <SessionHeader sessionIdShort={sessionIdShort} />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-[5%] -top-[10%] h-[40%] w-[40%] rounded-full bg-[#96f1fa]/20 blur-[120px]" />
          <div className="absolute bottom-[5%] right-[5%] h-[30%] w-[30%] rounded-full bg-[#92f2fb]/20 blur-[100px]" />
        </div>
        <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col px-4 py-4 sm:px-8 sm:py-6">
          <div className="group relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-3xl bg-[#dce4e8] shadow-inner dark:bg-slate-800">
            <div className="relative min-h-0 flex-1 bg-black">
              <AvatarVideoPane className="h-full w-full object-contain opacity-95 transition-transform duration-700 group-hover:scale-[1.02]" />
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-end">
                <VoiceAndCardsRow />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiAvatarLiveKitRoom({ serverUrl, token, sessionIdShort, onDisconnected }: Props) {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      audio
      video={false}
      className="flex h-full min-h-0 w-full flex-1 flex-col"
      onDisconnected={onDisconnected}
    >
      <SessionStage sessionIdShort={sessionIdShort} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
