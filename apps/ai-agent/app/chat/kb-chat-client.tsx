"use client";

import { Loader2, Volume2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@mediconnect/ui";

type Turn = { role: "user" | "assistant"; content: string; at?: number };

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

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function renderWithBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-cpa-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export type KbChatClientProps = {
  doctorDisplayName: string;
  specialtyLabel: string;
  avatarUrl?: string | null;
  /** Shown in the welcome line, e.g. `#PX-8821` */
  patientLabel?: string;
};

export function KbChatClient({
  doctorDisplayName,
  specialtyLabel,
  avatarUrl,
  patientLabel = "#PX-8821",
}: KbChatClientProps) {
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

  useEffect(() => {
    scrollToBottom();
  }, [messages, pending, scrollToBottom]);

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
    const nextUser: Turn = { role: "user", content: text, at: Date.now() };
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

  const showVoiceMeter = voiceConversation && (listening || pending || assistantSpeaking);
  const voiceMeterLabel = pending
    ? "Thinking…"
    : assistantSpeaking
      ? "Speaking…"
      : listening
        ? "Recording…"
        : "Mic…";

  const newConsultation = () => {
    if (messages.length === 0) {
      toast({ title: "New consultation", description: "Chat is already empty." });
      return;
    }
    stopVoiceConversation();
    setMessages([]);
    setDraft("");
    toast({ title: "New consultation", description: "Cleared current thread." });
  };

  const navSoon = (label: string) => {
    toast({ title: label, description: "This area is not wired up yet." });
  };

  const lastAssistantIndex = messages.map((m, i) => (m.role === "assistant" ? i : -1)).filter((i) => i >= 0).pop();

  return (
    <div className="bg-cpa-background font-cpa-body text-cpa-on-background min-h-screen antialiased">
      <header className="border-cpa-outline-variant/20 fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-[#f7f9fb] px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold tracking-tighter text-cpa-primary">
            Clinical Precision AI
          </Link>
          <div className="bg-cpa-outline-variant/30 hidden h-4 w-px md:block" />
          <span className="text-cpa-on-surface-variant hidden text-sm font-semibold md:block">Dr. Assistant</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-cpa-surface-container-low group focus-within:bg-cpa-surface-container-lowest relative flex items-center rounded-full px-4 py-1.5 transition-colors">
            <span className="material-symbols-outlined text-cpa-outline text-sm">search</span>
            <input
              className="placeholder:text-cpa-outline w-48 border-none bg-transparent text-sm focus:ring-0 sm:w-64 md:w-64"
              placeholder="Search patient or record..."
              type="search"
              aria-label="Search patient or record"
              onFocus={() => navSoon("Search")}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-cpa-on-surface-variant hover:bg-cpa-surface-container rounded-full p-2 transition-colors"
              aria-label="Account"
              onClick={() => navSoon("Account")}
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            <button
              type="button"
              className="text-cpa-on-surface-variant hover:bg-cpa-surface-container rounded-full p-2 transition-colors"
              aria-label="Settings"
              onClick={() => navSoon("Settings")}
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-16">
        <aside className="border-cpa-outline-variant/20 fixed left-0 top-16 z-40 flex h-[calc(100vh-64px)] w-72 flex-col border-r bg-[#f2f4f6] p-4">
          <div className="mb-6 flex items-center gap-3 px-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-10 w-10 rounded-full object-cover shadow-sm"
                src={avatarUrl}
                width={40}
                height={40}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cpa-primary/15 text-sm font-bold text-cpa-primary shadow-sm">
                {doctorDisplayName
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-cpa-on-surface">{doctorDisplayName}</h2>
              <p className="text-cpa-on-surface-variant text-[10px] font-medium uppercase tracking-wider">
                {specialtyLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={newConsultation}
            className="shadow-cpa-primary/20 mb-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-cpa-primary to-cpa-primary-container px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>New Consultation</span>
          </button>
          <nav className="flex-1 space-y-1">
            <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#003f87] shadow-sm">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span>Current Consultation</span>
            </div>
            <button
              type="button"
              onClick={() => navSoon("Patient History")}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#424752] transition-all hover:bg-[#e6e8ea]"
            >
              <span className="material-symbols-outlined">history</span>
              <span>Patient History</span>
            </button>
            <button
              type="button"
              onClick={() => navSoon("Clinical Guidelines")}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#424752] transition-all hover:bg-[#e6e8ea]"
            >
              <span className="material-symbols-outlined">menu_book</span>
              <span>Clinical Guidelines</span>
            </button>
            <button
              type="button"
              onClick={() => navSoon("Recent Transcripts")}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#424752] transition-all hover:bg-[#e6e8ea]"
            >
              <span className="material-symbols-outlined">record_voice_over</span>
              <span>Recent Transcripts</span>
            </button>
          </nav>
          <div className="border-cpa-outline-variant/20 mt-auto space-y-1 border-t pt-4">
            <button
              type="button"
              onClick={() => navSoon("Archive")}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#424752] transition-all hover:bg-[#e6e8ea]"
            >
              <span className="material-symbols-outlined">archive</span>
              <span>Archive</span>
            </button>
            <button
              type="button"
              onClick={() => navSoon("Support")}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#424752] transition-all hover:bg-[#e6e8ea]"
            >
              <span className="material-symbols-outlined">help</span>
              <span>Support</span>
            </button>
          </div>
        </aside>

        <main className="bg-cpa-surface relative ml-72 flex min-h-[calc(100vh-64px)] flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-8 overflow-y-auto scroll-smooth p-6 pb-40 sm:p-10">
            {messages.length === 0 ? (
              <div className="mx-auto flex max-w-4xl flex-col items-center space-y-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cpa-primary/5 text-cpa-primary">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    clinical_notes
                  </span>
                </div>
                <h1 className="font-cpa-headline text-3xl font-extrabold tracking-tight text-cpa-on-surface">
                  Clinical Precision AI
                </h1>
                <p className="text-cpa-on-surface-variant max-w-md">
                  Active consultation for Patient ID:{" "}
                  <span className="font-mono font-bold text-cpa-primary">{patientLabel}</span>. Ready for dictation or
                  diagnostic queries.
                </p>
                <p className="text-cpa-on-surface-variant max-w-lg text-sm">
                  Hospital knowledge search and optional patient chart tools. Use the mic for hands-free mode (Chrome/Edge), or
                  type below. <strong className="text-cpa-on-surface">Enter</strong> sends; pause ~1.4s after speaking to
                  submit.
                </p>
              </div>
            ) : null}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={`${i}-user`} className="mx-auto flex max-w-4xl flex-row-reverse gap-6">
                  <div className="border-cpa-outline-variant/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-cpa-surface-container-high text-cpa-on-surface-variant shadow-sm">
                    <span className="material-symbols-outlined text-xl">person</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="shadow-cpa-primary/10 rounded-xl rounded-tr-sm bg-cpa-primary p-6 text-cpa-on-primary shadow-md">
                      <p className="text-lg leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <p className="text-cpa-on-surface-variant mt-2 text-right text-[10px] font-medium uppercase tracking-tighter">
                      Read {formatTime(new Date(m.at ?? Date.now()))} • {doctorDisplayName}
                    </p>
                  </div>
                </div>
              ) : (
                <div key={`${i}-asst`} className="mx-auto flex max-w-4xl gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cpa-primary text-white shadow-md">
                    <span className="material-symbols-outlined text-xl">smart_toy</span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="border-cpa-outline-variant/10 rounded-xl rounded-tl-sm border bg-cpa-surface-container-lowest p-6 shadow-sm">
                      <div className="mb-3 flex items-center justify-end gap-2">
                        {!voiceConversation ? (
                          <button
                            type="button"
                            onClick={() => void playAssistantTts(m.content, i)}
                            disabled={ttsLoadingIndex !== null}
                            className="text-cpa-on-surface-variant hover:bg-cpa-surface-container-low inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {ttsLoadingIndex === i ? (
                              <Loader2 aria-hidden className="size-3.5 animate-spin" />
                            ) : (
                              <Volume2 aria-hidden className="size-3.5" />
                            )}
                            Listen
                          </button>
                        ) : null}
                      </div>
                      <p className="text-cpa-on-surface text-lg leading-relaxed whitespace-pre-wrap">
                        {renderWithBold(m.content)}
                      </p>
                    </div>
                    {i === lastAssistantIndex ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navSoon("Compare Historical Data")}
                          className="bg-cpa-secondary-container text-cpa-on-secondary-container hover:bg-cpa-secondary/20 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          Compare Historical Data
                        </button>
                        <button
                          type="button"
                          onClick={() => navSoon("Generate Treatment Memo")}
                          className="bg-cpa-secondary-container text-cpa-on-secondary-container hover:bg-cpa-secondary/20 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          Generate Treatment Memo
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )}

            {pending ? (
              <div className="mx-auto flex max-w-4xl gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cpa-primary text-white shadow-md">
                  <span className="material-symbols-outlined text-xl animate-pulse">smart_toy</span>
                </div>
                <div className="border-cpa-outline-variant/10 flex flex-1 items-center gap-3 rounded-xl rounded-tl-sm border border-dashed bg-cpa-surface-container-lowest/80 px-6 py-4 text-sm text-cpa-on-surface-variant">
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  Assistant is thinking…
                </div>
              </div>
            ) : null}

            {voiceConversation && liveCaption ? (
              <p className="text-cpa-on-surface-variant mx-auto max-w-4xl text-center text-sm italic">
                &ldquo;{liveCaption}&rdquo;
              </p>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <div className="from-cpa-surface via-cpa-surface/95 pointer-events-none absolute bottom-0 left-0 w-full bg-gradient-to-t to-transparent p-6 pt-12">
            <div className="shadow-cpa-on-surface/5 pointer-events-auto mx-auto flex max-w-4xl items-center gap-3 rounded-full border border-cpa-outline-variant/30 bg-cpa-surface-container-lowest p-2 shadow-2xl backdrop-blur-md">
              {showVoiceMeter ? (
                <>
                  <div className="flex h-10 items-center gap-2 px-4">
                    <div className="flex h-6 items-center gap-1">
                      {(
                        [
                          "h-2",
                          "h-4",
                          "h-6",
                          "h-4",
                          "h-2",
                          "h-5",
                          "h-3",
                        ] as const
                      ).map((h, idx) => (
                        <div
                          key={idx}
                          className={`voice-bar animate-pulse ${h}`}
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-cpa-primary-container text-[10px] font-bold font-mono uppercase tracking-widest">
                      {voiceMeterLabel}
                    </span>
                  </div>
                  <div className="bg-cpa-outline-variant/20 h-6 w-px" />
                </>
              ) : null}
              <input
                className="text-cpa-on-surface placeholder:text-cpa-outline/70 min-w-0 flex-1 border-none bg-transparent px-2 focus:ring-0"
                disabled={inputDisabled}
                placeholder={
                  voiceConversation
                    ? "Optional: type while voice is on (Enter to send)…"
                    : "Type a clinical query or command…"
                }
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendTyped();
                  }
                }}
              />
              <div className="flex items-center gap-1 pr-1">
                <button
                  type="button"
                  className="text-cpa-on-surface-variant hover:bg-cpa-surface-container rounded-full p-2 transition-colors"
                  aria-label="Attach file"
                  onClick={() => navSoon("Attachments")}
                >
                  <span className="material-symbols-outlined text-xl">attach_file</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleVoiceConversation()}
                  aria-pressed={voiceConversation}
                  aria-label={voiceConversation ? "Stop voice conversation" : "Start voice conversation"}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${
                    voiceConversation ? "bg-cpa-tertiary-container shadow-cpa-tertiary/30" : "bg-cpa-primary shadow-cpa-primary/30"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    mic
                  </span>
                </button>
              </div>
            </div>
            <div className="pointer-events-auto mx-auto mt-3 flex max-w-4xl justify-center gap-6">
              <div className="flex items-center gap-1.5 opacity-40">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Precision Model 4.5</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-40">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="fixed bottom-32 right-8 z-30 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navSoon("Summarize")}
          className="border-cpa-outline-variant/20 bg-cpa-surface-container-lowest text-cpa-on-surface group flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all hover:bg-cpa-primary hover:text-white"
          aria-label="Summarize"
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">summarize</span>
        </button>
        <button
          type="button"
          onClick={() => navSoon("Lab panel")}
          className="border-cpa-outline-variant/20 bg-cpa-surface-container-lowest text-cpa-on-surface group flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all hover:bg-cpa-primary hover:text-white"
          aria-label="Lab panel"
        >
          <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">lab_panel</span>
        </button>
      </div>
    </div>
  );
}
