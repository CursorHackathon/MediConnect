"use client";

import { useTranslation } from "@mediconnect/i18n";

export function HomeNoRole() {
  const { t } = useTranslation();
  return (
    <main className="container py-12">
      <p className="text-muted-foreground">{t("appt.home.no_role")}</p>
    </main>
  );
}
