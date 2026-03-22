"use client";

import Link from "next/link";
import { LanguageToggle, useTranslation } from "@mediconnect/i18n";
import { signOut, useSession } from "next-auth/react";
import { AppHubNav, Button } from "@mediconnect/ui";

export function Header({ links }: { links: { href: string; labelKey: string }[] }) {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <header className="border-b bg-background">
      <div className="container flex flex-col gap-2 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="font-semibold">
              {t("appt.header.brand")}
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
                  {t(l.labelKey)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            {session?.user?.name && (
              <span className="text-sm text-muted-foreground">{session.user.name}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              {t("header.logout")}
            </Button>
          </div>
        </div>
        <AppHubNav current="appointments" className="border-t border-border/60 pt-2" />
      </div>
    </header>
  );
}
