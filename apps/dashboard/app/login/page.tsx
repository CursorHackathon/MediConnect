"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, GlassAuthShell, Input } from "@mediconnect/ui";

import { useTranslation } from "@/app/lib/i18n";

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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t("login.error"));
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <GlassAuthShell
      hubCurrent="dashboard"
      title={t("login.title")}
      description={t("login.subtitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            {t("login.email")}
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@mediconnect.local"
            required
            className="bg-white/60 backdrop-blur-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            {t("login.password")}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/60 backdrop-blur-sm"
          />
        </div>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full shadow-md" disabled={loading}>
          {loading ? t("login.loading") : t("login.submit")}
        </Button>
      </form>
    </GlassAuthShell>
  );
}
