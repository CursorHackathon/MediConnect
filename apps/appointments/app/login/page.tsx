"use client";

import { LanguageToggle, useTranslation } from "@mediconnect/i18n";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHubNav, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@mediconnect/ui";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError(t("appt.login.error"));
    else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <AppHubNav current="appointments" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{t("appt.login.title")}</CardTitle>
            <LanguageToggle />
          </div>
          <p className="text-sm text-muted-foreground">{t("appt.login.subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@mediconnect.local"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("login.loading") : t("appt.login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
