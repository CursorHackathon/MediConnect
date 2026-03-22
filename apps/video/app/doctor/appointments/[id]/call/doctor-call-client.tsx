"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
  toast,
} from "@mediconnect/ui";

type Summary = {
  patientName: string;
  allergies: string[];
  medications: { name: string; dosage: string | null; frequency: string | null; prescribedBy: string | null }[];
  diagnoses: { condition: string; icd10Code: string | null; diagnosedAt: Date | null; notes: string | null }[];
};

type Status = {
  status: string;
  videoRoomUrl: string | null;
  callStartedAt: string | null;
  callEndedAt: string | null;
};

export function DoctorCallClient({ appointmentId }: { appointmentId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [kbQuery, setKbQuery] = useState("");
  const [kbChunks, setKbChunks] = useState<
    { id: string; source: string; content: string; score?: number }[]
  >([]);
  const [kbSearchMode, setKbSearchMode] = useState<"semantic" | "lexical" | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiCitations, setAiCitations] = useState<{ chunkId: string; source: string; excerpt: string }[]>([]);
  const [pendingAi, setPendingAi] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [postNotes, setPostNotes] = useState("");
  const [pendingComplete, setPendingComplete] = useState(false);

  const refreshStatus = useCallback(async () => {
    const res = await fetch(`/api/video/appointments/${appointmentId}/status`);
    if (res.ok) {
      setStatus(await res.json());
    }
  }, [appointmentId]);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/video/appointments/${appointmentId}/patient-summary`);
      if (res.ok) {
        setSummary(await res.json());
      } else {
        toast({ title: "Patientendaten", description: "Konnten nicht geladen werden.", variant: "destructive" });
      }
    })();
    void refreshStatus();
  }, [appointmentId, refreshStatus]);

  async function onStart() {
    setPendingStart(true);
    const res = await fetch(`/api/video/appointments/${appointmentId}/start`, { method: "POST" });
    setPendingStart(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      toast({
        title: "Start fehlgeschlagen",
        description: body?.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Anruf gestartet" });
    await refreshStatus();
  }

  async function searchKb() {
    const q = kbQuery.trim();
    if (!q) {
      setKbChunks([]);
      return;
    }
    const res = await fetch(
      `/api/video/appointments/${appointmentId}/knowledge-preview?q=${encodeURIComponent(q)}`,
    );
    if (res.ok) {
      const data = (await res.json()) as {
        mode?: "semantic" | "lexical";
        chunks: { id: string; source: string; content: string; score?: number }[];
      };
      setKbSearchMode(data.mode ?? null);
      setKbChunks(data.chunks);
    }
  }

  async function askKbAi() {
    const q = aiQuestion.trim();
    if (!q) {
      setAiAnswer(null);
      setAiCitations([]);
      return;
    }
    setPendingAi(true);
    setAiAnswer(null);
    setAiCitations([]);
    const res = await fetch("/api/video/rag/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    setPendingAi(false);
    const data = (await res.json().catch(() => null)) as
      | {
          answer?: string;
          citations?: { chunkId: string; source: string; excerpt: string }[];
          error?: string;
          message?: string;
        }
      | null;
    if (!res.ok) {
      toast({
        title: "KB (AI)",
        description: data?.message ?? data?.error ?? `Fehler ${res.status}`,
        variant: "destructive",
      });
      if (data?.citations?.length) setAiCitations(data.citations);
      return;
    }
    if (data?.answer) setAiAnswer(data.answer);
    if (data?.citations?.length) setAiCitations(data.citations);
  }

  async function onComplete() {
    setPendingComplete(true);
    const res = await fetch(`/api/video/appointments/${appointmentId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postCallNotes: postNotes, generateSoap: true }),
    });
    setPendingComplete(false);
    if (!res.ok) {
      toast({ title: "Speichern fehlgeschlagen", variant: "destructive" });
      return;
    }
    const data = await res.json();
    toast({ title: "Gespräch beendet", description: data.soapSummary ? "SOAP gespeichert." : undefined });
    setCompleteOpen(false);
    await refreshStatus();
  }

  const videoUrl = status?.videoRoomUrl;

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/doctor">Zurück</Link>
          </Button>
          <Badge>{status?.status ?? "…"}</Badge>
        </div>
        <Card className="min-h-[420px] flex-1 overflow-hidden p-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Video</CardTitle>
          </CardHeader>
          <CardContent className="h-[min(60vh,520px)] p-2 pt-0">
            {!videoUrl ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-md border border-dashed bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Starten Sie den Anruf, um den Raum zu öffnen. Der Patient sieht das Video erst nach Start.
                </p>
                <Button disabled={pendingStart} onClick={() => void onStart()}>
                  {pendingStart ? "…" : "Anruf starten"}
                </Button>
              </div>
            ) : (
              <iframe
                allow="camera; microphone; fullscreen; display-capture"
                className="h-full w-full rounded-md border bg-black"
                src={videoUrl}
                title="Videosprechstunde"
              />
            )}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button disabled={!videoUrl || status?.callEndedAt != null} onClick={() => setCompleteOpen(true)} variant="destructive">
            Gespräch beenden
          </Button>
        </div>
      </div>

      <aside className="w-full shrink-0 space-y-3 lg:w-[380px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium">{summary?.patientName ?? "…"}</p>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Allergien</p>
              <p className={summary?.allergies?.length ? "text-destructive" : ""}>
                {summary?.allergies?.length ? summary.allergies.join(", ") : "Keine erfasst"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Medikamente</p>
              <ul className="list-inside list-disc text-muted-foreground">
                {(summary?.medications ?? []).map((m) => (
                  <li key={m.name + (m.dosage ?? "")}>
                    {m.name}
                    {m.dosage ? `, ${m.dosage}` : ""}
                    {m.frequency ? ` — ${m.frequency}` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Diagnosen</p>
              <ul className="space-y-1 text-muted-foreground">
                {(summary?.diagnoses ?? []).map((d) => (
                  <li key={d.condition}>
                    {d.condition}
                    {d.icd10Code ? ` (${d.icd10Code})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Krankenhaus-Wissensbasis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input onChange={(e) => setKbQuery(e.target.value)} placeholder="Suchbegriff" value={kbQuery} />
              <Button onClick={() => void searchKb()} type="button" variant="secondary">
                Suchen
              </Button>
            </div>
            {kbSearchMode ? (
              <p className="text-[10px] uppercase text-muted-foreground">
                Retrieval: {kbSearchMode === "semantic" ? "semantisch (Embeddings)" : "lexikalisch (Fallback)"}
              </p>
            ) : null}
            <div className="h-48 overflow-y-auto rounded-md border p-2">
              {kbChunks.length === 0 ? (
                <p className="text-xs text-muted-foreground">Keine Treffer oder noch keine Suche.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {kbChunks.map((c) => (
                    <li key={c.id}>
                      <p className="font-medium">
                        {c.source}
                        {c.score !== undefined ? (
                          <span className="ml-1 font-normal text-muted-foreground">
                            ({(c.score * 100).toFixed(0)}% ähnlich)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-muted-foreground">{c.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">KB (AI) — English</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Grounded on hospital documents (RAG). Configure HUGGINGFACE_API_TOKEN (embeddings) and LLM_* (Featherless chat).
            </p>
            <Textarea
              className="min-h-[72px] text-sm"
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Ask a question in English…"
              value={aiQuestion}
            />
            <Button disabled={pendingAi} onClick={() => void askKbAi()} type="button" variant="secondary">
              {pendingAi ? "…" : "Ask KB (AI)"}
            </Button>
            {aiAnswer ? (
              <div className="rounded-md border bg-muted/20 p-2 text-xs">
                <p className="whitespace-pre-wrap font-medium text-foreground">{aiAnswer}</p>
              </div>
            ) : null}
            {aiCitations.length > 0 ? (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Sources</p>
                <ul className="max-h-32 space-y-2 overflow-y-auto text-[11px] text-muted-foreground">
                  {aiCitations.map((c) => (
                    <li key={c.chunkId}>
                      <span className="font-medium text-foreground">{c.source}</span>
                      <p>{c.excerpt}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </aside>

      <Dialog onOpenChange={setCompleteOpen} open={completeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gespräch abschließen</DialogTitle>
          </DialogHeader>
          <Textarea
            className="min-h-[120px]"
            onChange={(e) => setPostNotes(e.target.value)}
            placeholder="Notizen zur Videosprechstunde…"
            value={postNotes}
          />
          <DialogFooter>
            <Button onClick={() => setCompleteOpen(false)} variant="ghost">
              Abbrechen
            </Button>
            <Button disabled={pendingComplete} onClick={() => void onComplete()}>
              {pendingComplete ? "…" : "Speichern & SOAP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
