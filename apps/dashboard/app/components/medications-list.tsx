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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mediconnect/ui";
import type { MedicationWithDoctor } from "@mediconnect/types";

import {
  useMedications,
  useCreateMedication,
  useAdministerMedication,
  useDrugSearch,
} from "@/app/lib/hooks";
import { useTranslation } from "@/app/lib/i18n";
import { daysUntil, formatDateDE } from "@/app/lib/utils";

const FREQ_KEYS = ["ONCE_DAILY", "TWICE_DAILY", "THREE_TIMES_DAILY", "AS_NEEDED"] as const;

const SLOTS = [
  { key: "Morgens", i18nKey: "meds.slot_morning" },
  { key: "Mittags", i18nKey: "meds.slot_noon" },
  { key: "Abends", i18nKey: "meds.slot_evening" },
] as const;

const nativeSelectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type Props = { patientId: string; canEdit: boolean; isNurse: boolean };

export function MedicationsList({ patientId, canEdit, isNurse }: Props) {
  const { t, locale } = useTranslation();
  const { data: medications, isLoading } = useMedications(patientId);
  const createMed = useCreateMedication(patientId);
  const administer = useAdministerMedication(patientId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [drugQuery, setDrugQuery] = useState("");
  const { data: drugResults } = useDrugSearch(drugQuery);

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "ONCE_DAILY",
    route: "oral",
    startDate: "",
    endDate: "",
  });

  const active = (medications || []).filter((m: MedicationWithDoctor) => m.isActive);
  const archived = (medications || []).filter((m: MedicationWithDoctor) => !m.isActive);

  function handleCreate() {
    createMed.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ name: "", dosage: "", frequency: "ONCE_DAILY", route: "oral", startDate: "", endDate: "" });
        setDrugQuery("");
      },
    });
  }

  function handleAdminister(medicationId: string, slotKey: string) {
    administer.mutate({ medicationId, slotLabel: slotKey });
  }

  function refillWarning(med: MedicationWithDoctor): boolean {
    if (!med.endDate) return false;
    const days = daysUntil(med.endDate);
    return days !== null && days >= 0 && days < 7;
  }

  function renderRow(med: MedicationWithDoctor, showActions: boolean) {
    const hasRefillWarning = refillWarning(med);
    return (
      <TableRow key={med.id}>
        <TableCell>
          <span className="font-medium">{med.name}</span>
          {hasRefillWarning && (
            <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200" aria-label={t("meds.refill_warning")}>
              {t("meds.refill_warning")}
            </Badge>
          )}
        </TableCell>
        <TableCell>{med.dosage || "—"}</TableCell>
        <TableCell>{t(`freq.${med.frequency}`) || med.frequency || "—"}</TableCell>
        <TableCell>{med.route || "—"}</TableCell>
        <TableCell>{med.prescribedBy?.user?.name || "—"}</TableCell>
        <TableCell>{formatDateDE(med.startDate, locale)}</TableCell>
        <TableCell>{formatDateDE(med.endDate, locale)}</TableCell>
        {showActions && (
          <TableCell>
            <div className="flex gap-1">
              {SLOTS.map(({ key, i18nKey }) => {
                const label = t(i18nKey);
                const administered = med.administrations?.some(
                  (a) =>
                    a.slotLabel === key &&
                    new Date(a.administeredAt).toDateString() === new Date().toDateString(),
                );
                return (
                  <Button
                    key={key}
                    variant={administered ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    disabled={administered || administer.isPending}
                    onClick={() => handleAdminister(med.id, key)}
                    title={`${t("meds.administer_hint")} — ${label}`}
                    aria-label={label}
                  >
                    {label.slice(0, 2)}
                  </Button>
                );
              })}
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{t("meds.title")}</CardTitle>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{t("meds.add")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("meds.new")}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="relative">
                  <label className="text-sm font-medium">{t("meds.drug")} *</label>
                  <Input
                    value={form.name || drugQuery}
                    onChange={(e) => {
                      setDrugQuery(e.target.value);
                      setForm({ ...form, name: e.target.value });
                    }}
                    placeholder={t("meds.drug")}
                  />
                  {drugResults && drugResults.length > 0 && drugQuery.length >= 2 && !form.name.includes(drugResults[0]?.name) && (
                    <ul className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-background shadow-lg">
                      {drugResults.map((d: { name: string }, i: number) => (
                        <li key={i}>
                          <button
                            type="button"
                            className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                            onClick={() => { setForm({ ...form, name: d.name }); setDrugQuery(d.name); }}
                          >
                            {d.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">{t("meds.dosage")}</label>
                    <Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 5 mg" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("meds.frequency")}</label>
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                      className={nativeSelectClass}
                    >
                      {FREQ_KEYS.map((k) => (
                        <option key={k} value={k}>{t(`freq.${k}`)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">{t("meds.route")}</label>
                    <Input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="oral" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("meds.start")}</label>
                    <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("meds.end")}</label>
                    <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={!form.name || createMed.isPending}>
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
        ) : active.length === 0 && archived.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("meds.none")}</p>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">{t("meds.active")}</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("meds.drug")}</TableHead>
                        <TableHead>{t("meds.dosage")}</TableHead>
                        <TableHead>{t("meds.frequency")}</TableHead>
                        <TableHead>{t("meds.route")}</TableHead>
                        <TableHead>{t("meds.doctor")}</TableHead>
                        <TableHead>{t("meds.start")}</TableHead>
                        <TableHead>{t("meds.end")}</TableHead>
                        {isNurse && (
                          <TableHead title={t("meds.administer_hint")}>
                            {t("meds.administer")}
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {active.map((m: MedicationWithDoctor) => renderRow(m, isNurse))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {archived.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("meds.archived")}</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("meds.drug")}</TableHead>
                        <TableHead>{t("meds.dosage")}</TableHead>
                        <TableHead>{t("meds.frequency")}</TableHead>
                        <TableHead>{t("meds.route")}</TableHead>
                        <TableHead>{t("meds.doctor")}</TableHead>
                        <TableHead>{t("meds.start")}</TableHead>
                        <TableHead>{t("meds.end")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archived.map((m: MedicationWithDoctor) => renderRow(m, false))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
