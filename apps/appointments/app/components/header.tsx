"use client";

import Link from "next/link";
import { useTranslation } from "@mediconnect/i18n";
import { signOut, useSession } from "next-auth/react";
import { AppHubNav, Button } from "@mediconnect/ui";

export function Header({ links }: { links: { href: string; labelKey: string }[] }) {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 border-b border-white/35 bg-white/55 shadow-[0_12px_40px_rgba(45,47,51,0.07)] backdrop-blur-xl">
      <div className="container flex flex-col gap-3 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="font-ether-headline text-lg font-bold tracking-tight text-blue-800">
              {t("appt.header.brand")}
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="font-medium text-ether-on-surface-variant transition-colors hover:text-blue-700"
                >
                  {t(l.labelKey)}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {session?.user?.name && (
              <span className="text-sm text-ether-on-surface-variant">{session.user.name}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-white/50 bg-white/40 backdrop-blur-sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              {t("header.logout")}
            </Button>
          </div>
        </div>
        <div className="ether-glass-panel rounded-xl border border-white/40 px-3 py-2 shadow-sm">
          <AppHubNav current="appointments" className="[&_ul]:justify-start" />
        </div>
      </div>
    </header>
  );
}
