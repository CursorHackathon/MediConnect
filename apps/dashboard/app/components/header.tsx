"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@mediconnect/ui";

import { LanguageToggle, useTranslation } from "@/app/lib/i18n";

export function Header() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <header className="border-b bg-background">
      <div className="container flex h-14 items-center justify-between">
        <span className="font-semibold">{t("header.title")}</span>
        <div className="flex items-center gap-3">
          <LanguageToggle />
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
