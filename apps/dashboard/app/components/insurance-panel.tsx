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
} from "@mediconnect/ui";

import { useInsurance, useCreateInsurance } from "@/app/lib/hooks";
import { useTranslation } from "@/app/lib/i18n";
import { daysUntil, formatDateDE } from "@/app/lib/utils";

const nativeSelectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Props = { patientId: string; canEdit: boolean };

export function InsurancePanel({ patientId, canEdit }: Props) {
  const { t, locale } = useTranslation();
  const { data: records, isLoading } = useInsurance(patientId);
  const createIns = useCreateInsurance(patientId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    providerName: "",
    policyNumber: "",
    type: "GKV" as string,
    coverageTier: "",
    coPayAmount: "",
    insurerWebsiteUrl: "",
    validFrom: "",
    validTo: "",
  });

  function handleCreate() {
    createIns.mutate(
      { ...form, coPayAmount: form.coPayAmount ? parseFloat(form.coPayAmount) : null },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm({ providerName: "", policyNumber: "", type: "GKV", coverageTier: "", coPayAmount: "", insurerWebsiteUrl: "", validFrom: "", validTo: "" });
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{t("ins.title")}</CardTitle>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{t("ins.add")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("ins.new")}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <label className="text-sm font-medium">{t("ins.provider")} *</label>
                  <Input value={form.providerName} onChange={(e) => setForm({ ...form, providerName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">{t("ins.policy")}</label>
                    <Input value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("ins.type")}</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className={nativeSelectClass}
                    >
                      <option value="GKV">GKV</option>
                      <option value="PKV">PKV</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">{t("ins.tier")}</label>
                    <Input value={form.coverageTier} onChange={(e) => setForm({ ...form, coverageTier: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("ins.copay")}</label>
                    <Input type="number" value={form.coPayAmount} onChange={(e) => setForm({ ...form, coPayAmount: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("ins.website")}</label>
                    <Input value={form.insurerWebsiteUrl} onChange={(e) => setForm({ ...form, insurerWebsiteUrl: e.target.value })} placeholder="https://…" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">{t("ins.valid_from")}</label>
                    <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("ins.valid_to")}</label>
                    <Input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={!form.providerName || createIns.isPending}>
                  {t("btn.save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : !records || records.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("ins.none")}</p>
        ) : (
          <div className="space-y-4">
            {records.map((ins) => {
              const expiryDays = daysUntil(ins.validTo);
              const expiryWarning = expiryDays !== null && expiryDays >= 0 && expiryDays < 30;

              return (
                <div key={ins.id} className="rounded-md border p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{ins.providerName}</span>
                    {ins.type && (
                      <Badge
                        className={
                          ins.type === "GKV"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }
                        aria-label={`${t("ins.type")}: ${ins.type}`}
                      >
                        {ins.type}
                      </Badge>
                    )}
                    {expiryWarning && (
                      <Badge className="bg-red-100 text-red-800 border-red-200" aria-label={t("ins.expiry_warning", { days: expiryDays! })}>
                        {t("ins.expiry_warning", { days: expiryDays! })}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
                    {ins.policyNumber && (
                      <div>
                        <span className="text-muted-foreground">{t("ins.policy")}</span>
                        <p>{ins.policyNumber}</p>
                      </div>
                    )}
                    {ins.coverageTier && (
                      <div>
                        <span className="text-muted-foreground">{t("ins.tier")}</span>
                        <p>{ins.coverageTier}</p>
                      </div>
                    )}
                    {ins.coPayAmount != null && (
                      <div>
                        <span className="text-muted-foreground">{t("ins.copay")}</span>
                        <p>{ins.coPayAmount.toFixed(2)} EUR</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">{t("ins.validity")}</span>
                      <p>{formatDateDE(ins.validFrom, locale)} — {formatDateDE(ins.validTo, locale)}</p>
                    </div>
                  </div>
                  {ins.insurerWebsiteUrl && (
                    <a href={ins.insurerWebsiteUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary underline">
                      {t("ins.insurer_website")}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
