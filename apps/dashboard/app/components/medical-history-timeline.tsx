"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Textarea,
} from "@mediconnect/ui";
import type { MedicalHistoryWithDoctor } from "@mediconnect/types";

import { useMedicalHistory, useCreateMedicalHistory } from "@/app/lib/hooks";
import { useTranslation } from "@/app/lib/i18n";
import { formatDateDE } from "@/app/lib/utils";

const VISIT_TYPES = ["DIAGNOSIS", "HOSPITAL_VISIT", "SURGERY", "OTHER"] as const;

const nativeSelectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Props = { patientId: string; canEdit: boolean };

export function MedicalHistoryTimeline({ patientId, canEdit }: Props) {
  const { t, locale } = useTranslation();
  const { data: entries, isLoading } = useMedicalHistory(patientId);
  const createEntry = useCreateMedicalHistory(patientId);

  const [filterType, setFilterType] = useState("all");
  const [filterSince, setFilterSince] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    condition: "",
    icd10Code: "",
    icd10Name: "",
    visitType: "DIAGNOSIS",
    diagnosedAt: "",
    notes: "",
  });

  const filtered = (entries || []).filter((e: MedicalHistoryWithDoctor) => {
    if (filterType !== "all" && e.visitType !== filterType) return false;
    if (filterSince && e.diagnosedAt && new Date(e.diagnosedAt) < new Date(filterSince))
      return false;
    return true;
  });

  function handleCreate() {
    createEntry.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ condition: "", icd10Code: "", icd10Name: "", visitType: "DIAGNOSIS", diagnosedAt: "", notes: "" });
      },
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{t("history.title")}</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`${nativeSelectClass} w-[160px]`}
          >
            <option value="all">{t("history.all_types")}</option>
            {VISIT_TYPES.map((k) => (
              <option key={k} value={k}>{t(`visit.${k}`)}</option>
            ))}
          </select>
          <Input
            type="date"
            value={filterSince}
            onChange={(e) => setFilterSince(e.target.value)}
            className="w-[150px]"
            aria-label={t("history.since")}
          />
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">{t("history.add")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("history.new_entry")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div>
                    <label className="text-sm font-medium">{t("history.condition")} *</label>
                    <Input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">{t("history.icd_code")}</label>
                      <Input value={form.icd10Code} onChange={(e) => setForm({ ...form, icd10Code: e.target.value })} placeholder="e.g. I10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("history.icd_name")}</label>
                      <Input value={form.icd10Name} onChange={(e) => setForm({ ...form, icd10Name: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">{t("history.type")}</label>
                      <select
                        value={form.visitType}
                        onChange={(e) => setForm({ ...form, visitType: e.target.value })}
                        className={nativeSelectClass}
                      >
                        {VISIT_TYPES.map((k) => (
                          <option key={k} value={k}>{t(`visit.${k}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("history.date")}</label>
                      <Input type="date" value={form.diagnosedAt} onChange={(e) => setForm({ ...form, diagnosedAt: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("history.notes")}</label>
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
                  </div>
                  <Button onClick={handleCreate} disabled={!form.condition || createEntry.isPending}>
                    {t("btn.save")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("history.no_entries")}</p>
        ) : (
          <div className="relative space-y-4 border-l-2 border-muted pl-6">
            {filtered.map((entry: MedicalHistoryWithDoctor) => (
              <div key={entry.id} className="relative">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium">{formatDateDE(entry.diagnosedAt, locale)}</span>
                  <Badge variant="outline" className="text-xs">
                    {t(`visit.${entry.visitType}`) || entry.visitType}
                  </Badge>
                </div>
                <p className="font-medium">{entry.condition}</p>
                {entry.icd10Code && (
                  <p className="text-sm text-muted-foreground">
                    ICD-10: {entry.icd10Code}
                    {entry.icd10Name && ` — ${entry.icd10Name}`}
                  </p>
                )}
                {entry.attendingDoctor?.user?.name && (
                  <p className="text-sm text-muted-foreground">
                    {t("history.doctor")}: {entry.attendingDoctor.user.name}
                  </p>
                )}
                {entry.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">{entry.notes}</p>
                )}
                {entry.attachments && entry.attachments.length > 0 && (
                  <div className="mt-1 flex gap-2">
                    {entry.attachments.map((a: { id: string; storageUrl: string; fileName: string }) => (
                      <a key={a.id} href={a.storageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                        {a.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
