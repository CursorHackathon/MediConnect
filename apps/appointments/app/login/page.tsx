"use client";

import { useTranslation } from "@mediconnect/i18n";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, GlassAuthShell, Input } from "@mediconnect/ui";

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
    <GlassAuthShell
      hubCurrent="appointments"
      title={t("appt.login.title")}
      description={t("appt.login.subtitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@mediconnect.local"
          required
          className="bg-white/60 backdrop-blur-sm"
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white/60 backdrop-blur-sm"
        />
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full shadow-md" disabled={loading}>
          {loading ? t("login.loading") : t("appt.login.submit")}
        </Button>
      </form>
    </GlassAuthShell>
  );
}
