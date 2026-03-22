"use client";

import { Loader2, MessageSquare, Mic, Radio, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Card, CardContent, CardHeader, CardTitle, Textarea, toast } from "@mediconnect/ui";

type Turn = { role: "user" | "assistant"; content: string };

const SILENCE_MS = 1400;

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window &
    typeof globalThis & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function KbChatClient() {
  const [messages, setMessages] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [ttsLoadingIndex, setTtsLoadingIndex] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceConversation, setVoiceConversation] = useState(false);
  const [liveCaption, setLiveCaption] = useState("");
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const messagesRef = useRef<Turn[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceBufferRef = useRef("");
  const flushInProgressRef = useRef(false);
  const assistantSpeakingRef = useRef(false);
  const voiceConversationRef = useRef(false);
  const pendingRef = useRef(false);

  const startContinuousRecognitionRef = useRef<() => void>(() => {});
  const stopVoiceConversationRef = useRef<() => void>(() => {});

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    voiceConversationRef.current = voiceConversation;
  }, [voiceConversation]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAudio(), [stopAudio]);

  useEffect(
    () => () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    },
    [],
  );

  const sendMessage = useCallback(async (rawText: string): Promise<string | null> => {
    const text = rawText.trim();
    if (!text) return null;
    const prev = messagesRef.current;
    const nextUser: Turn = { role: "user", content: text };
    const history: Turn[] = [...prev, nextUser];
    setMessages(history);
    setDraft("");
    setPending(true);

    try {
      const res = await fetch("/api/v1/chat/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!res.ok) {
        const desc = data?.message ?? data?.error ?? `HTTP ${res.status}`;
        if (res.status === 403) {
          toast({
            title: "Access denied",
            description: "Doctor or admin session required for this assistant.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Chat failed", description: desc, variant: "destructive" });
        }
        setMessages(prev);
        return null;
      }

      const reply = typeof data?.message === "string" ? data.message : "";
      if (!reply) {
        toast({ title: "Empty reply", variant: "destructive" });
        setMessages(prev);
        return null;
      }

      setMessages([...history, { role: "assistant", content: reply }]);
      setTimeout(scrollToBottom, 100);
      return reply;
    } catch {
      toast({ title: "Network error", variant: "destructive" });
      setMessages(prev);
      return null;
    } finally {
      setPending(false);
    }
  }, [scrollToBottom]);

  const playTtsText = useCallback(
    async (text: string): Promise<boolean> => {
      stopAudio();
      try {
        const res = await fetch("/api/v1/tts/elevenlabs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
          const desc = data?.message ?? data?.error ?? `HTTP ${res.status}`;
          toast({ title: "Voice reply failed", description: desc, variant: "destructive" });
          return false;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(url);
            objectUrlRef.current = null;
            audioRef.current = null;
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            objectUrlRef.current = null;
            audioRef.current = null;
            reject(new Error("audio playback error"));
          };
          void audio.play().catch(reject);
        });
        return true;
      } catch {
        toast({ title: "Voice reply failed", description: "Network or audio error", variant: "destructive" });
        return false;
      }
    },
    [stopAudio],
  );

  const performFlush = useCallback(async () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    const text = voiceBufferRef.current.trim();
    voiceBufferRef.current = "";
    setLiveCaption("");
    if (!text || !voiceConversationRef.current) return;

    flushInProgressRef.current = true;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);

    const reply = await sendMessage(text);

    if (voiceConversationRef.current && reply) {
      assistantSpeakingRef.current = true;
      setAssistantSpeaking(true);
      await playTtsText(reply);
      assistantSpeakingRef.current = false;
      setAssistantSpeaking(false);
    }

    flushInProgressRef.current = false;

    if (voiceConversationRef.current && !pendingRef.current) {
      startContinuousRecognitionRef.current();
    }
  }, [playTtsText, sendMessage]);

  const scheduleFlush = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      void performFlush();
    }, SILENCE_MS);
  }, [performFlush]);

  const startContinuousRecognition = useCallback(() => {
    if (!voiceConversationRef.current) return;
    if (pendingRef.current || flushInProgressRef.current || assistantSpeakingRef.current) return;
    if (recognitionRef.current) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      toast({
        title: "Voice input unavailable",
        description: "Use Chrome or Edge on HTTPS or localhost.",
        variant: "destructive",
      });
      stopVoiceConversationRef.current();
      return;
    }

    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (!voiceConversationRef.current) return;
      let newFinal = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (!r?.[0]) continue;
        if (r.isFinal) newFinal += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      if (newFinal) {
        voiceBufferRef.current += newFinal;
        scheduleFlush();
      }
      setLiveCaption(interim);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;
      if (event.error === "no-speech") return;
      toast({
        title: "Voice input error",
        description: event.error === "not-allowed" ? "Microphone permission denied." : event.error,
        variant: "destructive",
      });
      stopVoiceConversationRef.current();
    };

    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      if (!voiceConversationRef.current) return;
      if (flushInProgressRef.current || pendingRef.current || assistantSpeakingRef.current) return;
      window.setTimeout(() => {
        if (
          voiceConversationRef.current &&
          !recognitionRef.current &&
          !flushInProgressRef.current &&
          !pendingRef.current &&
          !assistantSpeakingRef.current
        ) {
          startContinuousRecognitionRef.current();
        }
      }, 250);
    };

    try {
      rec.start();
      setListening(true);
    } catch {
      toast({ title: "Could not start microphone", variant: "destructive" });
      recognitionRef.current = null;
      stopVoiceConversationRef.current();
    }
  }, [scheduleFlush]);

  useEffect(() => {
    startContinuousRecognitionRef.current = startContinuousRecognition;
  }, [startContinuousRecognition]);

  const stopVoiceConversation = useCallback(() => {
    setVoiceConversation(false);
    voiceConversationRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    voiceBufferRef.current = "";
    setLiveCaption("");
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
    stopAudio();
    flushInProgressRef.current = false;
    assistantSpeakingRef.current = false;
    setAssistantSpeaking(false);
  }, [stopAudio]);

  useEffect(() => {
    stopVoiceConversationRef.current = stopVoiceConversation;
  }, [stopVoiceConversation]);

  const toggleVoiceConversation = useCallback(() => {
    if (voiceConversation) {
      stopVoiceConversation();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      toast({
        title: "Voice conversation unavailable",
        description: "Use Chrome or Edge. Speech recognition is not available in this browser.",
        variant: "destructive",
      });
      return;
    }
    setVoiceConversation(true);
    voiceConversationRef.current = true;
    voiceBufferRef.current = "";
    setLiveCaption("");
    window.setTimeout(() => startContinuousRecognitionRef.current(), 0);
  }, [voiceConversation, stopVoiceConversation]);

  useEffect(() => {
    if (!voiceConversation) return;
    if (pending || assistantSpeaking) return;
    if (flushInProgressRef.current) return;
    if (recognitionRef.current || listening) return;
    const t = window.setTimeout(() => {
      if (
        voiceConversationRef.current &&
        !recognitionRef.current &&
        !flushInProgressRef.current &&
        !pendingRef.current &&
        !assistantSpeakingRef.current
      ) {
        startContinuousRecognitionRef.current();
      }
    }, 300);
    return () => clearTimeout(t);
  }, [voiceConversation, pending, listening, assistantSpeaking]);

  const sendTyped = useCallback(async () => {
    const text = draft.trim();
    if (!text || pending) return;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
    const reply = await sendMessage(text);
    if (voiceConversationRef.current && reply) {
      assistantSpeakingRef.current = true;
      setAssistantSpeaking(true);
      await playTtsText(reply);
      assistantSpeakingRef.current = false;
      setAssistantSpeaking(false);
      if (voiceConversationRef.current && !pendingRef.current) {
        startContinuousRecognitionRef.current();
      }
    } else if (voiceConversationRef.current && !pendingRef.current) {
      startContinuousRecognitionRef.current();
    }
  }, [draft, pending, sendMessage, playTtsText]);

  const playAssistantTts = useCallback(
    async (text: string, messageIndex: number) => {
      setTtsLoadingIndex(messageIndex);
      try {
        await playTtsText(text);
      } finally {
        setTtsLoadingIndex(null);
      }
    },
    [playTtsText],
  );

  const inputDisabled = pending;

  return (
    <Card className="flex h-[min(720px,calc(100vh-8rem))] flex-col">
      <CardHeader className="shrink-0 space-y-3 border-b pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-lg">Patient health assistant (demo)</CardTitle>
          <Button
            className="gap-2 shrink-0"
            onClick={() => toggleVoiceConversation()}
            type="button"
            variant={voiceConversation ? "default" : "outline"}
          >
            {voiceConversation ? (
              <>
                <Radio aria-hidden className="size-4" />
                Voice chat on
              </>
            ) : (
              <>
                <Mic aria-hidden className="size-4" />
                Voice conversation
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <strong className="font-medium text-foreground">Brain:</strong> Featherless + hospital KB search, optional patient
          chart (email + prior appointment for doctors), drug-check stub.{" "}
          <strong className="font-medium text-foreground">Voice:</strong> mic → pause ~1.4s → send → ElevenLabs reply → mic
          again. <strong className="font-medium text-foreground">Text:</strong> type and Send; Listen per message when voice is
          off.
        </p>
        {voiceConversation ? (
          <div
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              listening ? "border-primary/40 bg-primary/5" : "bg-muted/40"
            }`}
          >
            {pending ? (
              <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <span
                aria-hidden
                className={`size-2 shrink-0 rounded-full ${
                  assistantSpeaking
                    ? "bg-sky-500"
                    : listening
                      ? "animate-pulse bg-red-500"
                      : "bg-muted-foreground/40"
                }`}
              />
            )}
            <span className="text-muted-foreground">
              {pending
                ? "Thinking…"
                : assistantSpeaking
                  ? "Assistant speaking…"
                  : listening
                    ? "Listening — speak naturally, pause when done."
                    : "Starting microphone…"}
            </span>
            {liveCaption ? <span className="truncate text-foreground/80 italic">&ldquo;{liveCaption}&rdquo;</span> : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4 pt-3">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-md border bg-muted/20 p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Turn on <strong>Voice conversation</strong> for hands-free back-and-forth, or type below. Chrome/Edge
              recommended.
            </p>
          ) : (
            messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-lg bg-primary/10 px-3 py-2 text-sm"
                    : "mr-8 rounded-lg border bg-card px-3 py-2 text-sm"
                }
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {m.role === "user" ? "You" : "Assistant"}
                  </p>
                  {m.role === "assistant" && !voiceConversation ? (
                    <Button
                      className="h-7 gap-1 px-2 text-xs"
                      disabled={ttsLoadingIndex !== null}
                      onClick={() => void playAssistantTts(m.content, i)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {ttsLoadingIndex === i ? (
                        <Loader2 aria-hidden className="size-3.5 animate-spin" />
                      ) : (
                        <Volume2 aria-hidden className="size-3.5" />
                      )}
                      Listen
                    </Button>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Textarea
            className="min-h-[88px] flex-1 resize-none text-sm"
            disabled={inputDisabled}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendTyped();
              }
            }}
            placeholder={
              voiceConversation
                ? "Optional: type a message while voice chat is on (Enter to send)…"
                : "Type a question… (Enter to send, Shift+Enter for newline)"
            }
            value={draft}
          />
          <Button
            className="shrink-0 sm:self-end"
            disabled={pending || !draft.trim()}
            onClick={() => void sendTyped()}
            variant="secondary"
          >
            <MessageSquare aria-hidden className="mr-1.5 size-4" />
            {pending ? "…" : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
