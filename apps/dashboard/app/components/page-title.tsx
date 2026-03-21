"use client";

import { useTranslation } from "@/app/lib/i18n";

export function PageTitle({ type }: { type: "patient" | "clinical" }) {
  const { t } = useTranslation();
  return (
    <h1 className="text-2xl font-semibold">
      {type === "patient" ? t("my_dashboard") : t("clinical_dashboard")}
    </h1>
  );
}
