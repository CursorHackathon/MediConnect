"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@mediconnect/ui";

import { useTranslation } from "@/app/lib/i18n";

export function Header() {
  const { data: session } = useSession();
  const { locale, setLocale, t } = useTranslation();

  return (
    <header className="border-b bg-background">
      <div className="container flex h-14 items-center justify-between">
        <span className="font-semibold">{t("header.title")}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLocale(locale === "de" ? "en" : "de")}
            className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent"
            aria-label="Toggle language"
          >
            {locale === "de" ? "DE" : "EN"}
          </button>
          {session?.user?.name && (
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
          )}
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            {t("header.logout")}
          </Button>
        </div>
      </div>
    </header>
  );
}
