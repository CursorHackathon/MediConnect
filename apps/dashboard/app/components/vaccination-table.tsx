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

import { useVaccinations, useCreateVaccination } from "@/app/lib/hooks";
import { useTranslation } from "@/app/lib/i18n";
import { daysUntil, formatDateDE, VACCINATION_STATUS_CONFIG } from "@/app/lib/utils";

type Props = { patientId: string; canEdit: boolean; isPatient: boolean };

function statusReason(
  status: string,
  nextDueDate: Date | string | null | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string,
  locale: string,
): string {
  if (!nextDueDate) return t("vacc.reason_no_date");
  const days = daysUntil(nextDueDate);
  if (days === null) return "";

  if (status === "OVERDUE") {
    return t("vacc.reason_overdue", { date: formatDateDE(nextDueDate, locale) });
  }
  if (status === "DUE_SOON") {
    return t("vacc.reason_due_soon", { days: Math.max(0, days) });
  }
  return t("vacc.reason_up_to_date", { days });
}

export function VaccinationTable({ patientId, canEdit, isPatient }: Props) {
  const { t, locale } = useTranslation();
  const { data: vaccinations, isLoading } = useVaccinations(patientId);
  const createVacc = useCreateVaccination(patientId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    administeredAt: "",
    batch: "",
    nextDueDate: "",
  });

  function handleCreate() {
    createVacc.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ name: "", administeredAt: "", batch: "", nextDueDate: "" });
      },
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{t("vacc.title")}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{t("vacc.status_hint")}</p>
        </div>
        <div className="flex gap-2">
          {isPatient && (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              {t("vacc.print")}
            </Button>
          )}
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">{t("vacc.add")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("vacc.new")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div>
                    <label className="text-sm font-medium">{t("vacc.vaccine")} *</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("vacc.date")}</label>
                    <Input type="date" value={form.administeredAt} onChange={(e) => setForm({ ...form, administeredAt: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("vacc.batch")}</label>
                    <Input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("vacc.next_dose")}</label>
                    <Input type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} />
                  </div>
                  <Button onClick={handleCreate} disabled={!form.name || createVacc.isPending}>
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
        ) : !vaccinations || vaccinations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("vacc.none")}</p>
        ) : (
          <>
            <div className="mb-4 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium">{t("vacc.legend_title")}</p>
              <ul className="mt-1 space-y-0.5">
                <li><Badge className="bg-green-100 text-green-800 border-green-200 mr-1.5 text-[10px]">{t("vacc.UP_TO_DATE")}</Badge>{t("vacc.legend_up_to_date")}</li>
                <li><Badge className="bg-amber-100 text-amber-800 border-amber-200 mr-1.5 text-[10px]">{t("vacc.DUE_SOON")}</Badge>{t("vacc.legend_due_soon")}</li>
                <li><Badge className="bg-red-100 text-red-800 border-red-200 mr-1.5 text-[10px]">{t("vacc.OVERDUE")}</Badge>{t("vacc.legend_overdue")}</li>
              </ul>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("vacc.vaccine")}</TableHead>
                    <TableHead>{t("vacc.date")}</TableHead>
                    <TableHead>{t("vacc.batch")}</TableHead>
                    <TableHead>{t("vacc.next_dose")}</TableHead>
                    <TableHead>{t("vacc.doctor")}</TableHead>
                    <TableHead>{t("vacc.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccinations.map((v) => {
                    const cfg = VACCINATION_STATUS_CONFIG[v.status];
                    const reason = statusReason(v.status, v.nextDueDate, t, locale);
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell>{formatDateDE(v.administeredAt, locale)}</TableCell>
                        <TableCell>{v.batch || "—"}</TableCell>
                        <TableCell>{formatDateDE(v.nextDueDate, locale)}</TableCell>
                        <TableCell>{v.administeringDoctor?.user?.name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              className={cfg.className}
                              aria-label={`${t("vacc.status")}: ${t(`vacc.${v.status}`)}`}
                            >
                              {t(`vacc.${v.status}`)}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{reason}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
