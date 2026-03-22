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
      toast({ title: "Upload failed", variant: "destructive" });
      return;
    }
    const data = (await res.json()) as { created: number };
    toast({ title: "Saved", description: `${data.created} text chunks created.` });
    setContent("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paste document text</CardTitle>
        <CardDescription>
          Free text is split into overlapping chunks and indexed for the hospital knowledge base used in video visits
          (lexical search).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <Input onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" value={title} />
          <Textarea
            className="min-h-[200px]"
            onChange={(e) => setContent(e.target.value)}
            placeholder="Protocols, forms, internal guidelines…"
            required
            value={content}
          />
          <Button disabled={pending} type="submit">
            {pending ? "…" : "Upload & chunk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
