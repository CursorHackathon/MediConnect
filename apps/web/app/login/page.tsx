"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, toast } from "@mediconnect/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("patient@mediconnect.local");
  const [password, setPassword] = useState("mediconnect-dev");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });
    setPending(false);
    if (res?.error) {
      toast({ title: "Anmeldung fehlgeschlagen", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Angemeldet" });
    window.location.href = res?.url ?? "/";
  }

  return (
    <main className="container flex min-h-screen max-w-md flex-col justify-center py-12">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>MediConnect Telehealth</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Input
              autoComplete="email"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              type="email"
              value={email}
            />
            <Input
              autoComplete="current-password"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              type="password"
              value={password}
            />
            <Button disabled={pending} type="submit">
              {pending ? "…" : "Anmelden"}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Zurück</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
