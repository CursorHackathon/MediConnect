"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useConnectionState,
  useRemoteParticipants,
  useTracks,
  TrackToggle,
  StartAudio,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";

const AVATAR_IDENTITY = "bey-avatar-agent";

type Props = {
  serverUrl: string;
  token: string;
  onDisconnected?: () => void;
};

function AvatarVideoRenderer() {
  const connectionState = useConnectionState();
  const remoteParticipants = useRemoteParticipants();

  const avatarParticipant = remoteParticipants.find(
    (p) => p.identity === AVATAR_IDENTITY,
  );

  const allVideoTracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: true },
  );

  const avatarTrack = allVideoTracks.find(
    (t) => t.participant.identity === AVATAR_IDENTITY,
  );

  if (connectionState === ConnectionState.Connecting) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Verbindung wird hergestellt…
      </div>
    );
  }

  if (!avatarParticipant) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p>Warte auf Avatar…</p>
        <p className="text-xs opacity-60">
          Der Beyond-Presence-Avatar tritt dem Raum bei.
        </p>
      </div>
    );
  }

  if (!avatarTrack) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p>Avatar verbunden — warte auf Video…</p>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={avatarTrack}
      className="h-full w-full object-contain"
    />
  );
}

function MicControl() {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <TrackToggle
        source={Track.Source.Microphone}
        className="lk-button lk-button-toggle"
      />
      <StartAudio label="Audio aktivieren" className="lk-button" />
    </div>
  );
}

export function AiAvatarLiveKitRoom({ serverUrl, token, onDisconnected }: Props) {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      audio
      video={false}
      className="flex h-full w-full flex-col"
      onDisconnected={onDisconnected}
    >
      <div className="relative min-h-0 flex-1">
        <AvatarVideoRenderer />
      </div>
      <MicControl />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
