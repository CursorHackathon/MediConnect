"use client";

import { useState } from "react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Textarea, toast } from "@mediconnect/ui";

export function KnowledgeUploadForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetch("/api/admin/knowledge/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setPending(false);
    if (!res.ok) {
      toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
      return;
    }
    const data = (await res.json()) as { created: number };
    toast({ title: "Gespeichert", description: `${data.created} Textabschnitte angelegt.` });
    setContent("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumenttext einfügen</CardTitle>
        <CardDescription>
          Freitext wird in überlappende Abschnitte zerlegt und als Krankenhaus-Wissensbasis für die Videosprechstunde
          indexiert (lexikalische Suche).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <Input onChange={(e) => setTitle(e.target.value)} placeholder="Titel (optional)" value={title} />
          <Textarea
            className="min-h-[200px]"
            onChange={(e) => setContent(e.target.value)}
            placeholder="Protokolle, Formularien, interne Leitlinien…"
            required
            value={content}
          />
          <Button disabled={pending} type="submit">
            {pending ? "…" : "Hochladen & chunken"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
