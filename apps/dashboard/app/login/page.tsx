"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@mediconnect/ui";

import { LanguageToggle, useTranslation } from "@/app/lib/i18n";

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
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{t("login.title")}</CardTitle>
            <LanguageToggle />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("login.subtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
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
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                {t("login.password")}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("login.loading") : t("login.submit")}
            </Button>
          </form>
          <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium">{t("login.demo")}</p>
            <p>{t("login.demo_doctor")}: doctor@mediconnect.local</p>
            <p>{t("login.demo_patient")}: patient@mediconnect.local</p>
            <p>{t("login.demo_nurse")}: nurse@mediconnect.local</p>
            <p>{t("login.demo_password")}: mediconnect-dev</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
