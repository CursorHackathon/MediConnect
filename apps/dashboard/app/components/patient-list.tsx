"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@mediconnect/ui";

import { useTranslation } from "@/app/lib/i18n";
import { getInitials } from "@/app/lib/utils";

type PatientRow = {
  id: string;
  gender: string | null;
  bloodType: string | null;
  user: { name: string | null; email: string };
};

export function PatientList() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/v1/patients")
      .then((r) => r.json())
      .then((data) => setPatients(data))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.user.name?.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("patients.title")}</CardTitle>
        <Input
          placeholder={t("patients.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2 max-w-sm"
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("patients.none")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <a
                key={p.id}
                href={`/patients/${p.id}`}
                className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
              >
                <Avatar>
                  <AvatarFallback>{getInitials(p.user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.user.name || p.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.gender ? t(`gender.${p.gender}`) : "—"}
                    {p.bloodType && ` · ${p.bloodType}`}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
