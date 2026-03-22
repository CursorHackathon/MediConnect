"use client";

import { signOut, useSession } from "next-auth/react";
import { AppHubNav, Button } from "@mediconnect/ui";

import { LanguageToggle, useTranslation } from "@/app/lib/i18n";

export function Header() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <header className="border-b bg-background">
      <div className="container flex flex-col gap-2 py-2">
        <div className="flex h-12 items-center justify-between gap-4">
          <span className="shrink-0 font-semibold">{t("header.title")}</span>
          <div className="flex shrink-0 items-center gap-3">
            <LanguageToggle />
            {session?.user?.name && (
              <span className="hidden text-sm text-muted-foreground sm:inline">{session.user.name}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              {t("header.logout")}
            </Button>
          </div>
        </div>
        <AppHubNav current="dashboard" className="border-t border-border/60 pt-2" />
      </div>
    </header>
  );
}
