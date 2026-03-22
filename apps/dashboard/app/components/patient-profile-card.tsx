"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@mediconnect/ui";

import { usePatientProfile, useUpdateProfile } from "@/app/lib/hooks";
import { useTranslation } from "@/app/lib/i18n";
import { formatDateDE, getInitials } from "@/app/lib/utils";

type Props = { patientId: string; canEdit?: boolean };

export function PatientProfileCard({ patientId, canEdit = false }: Props) {
  const { t, locale } = useTranslation();
  const { data: patient, isLoading } = usePatientProfile(patientId);
  const updateProfile = useUpdateProfile(patientId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  if (isLoading || !patient) {
    return (
      <Card>
        <CardHeader><CardTitle>{t("profile.title")}</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("loading")}</CardContent>
      </Card>
    );
  }

  const name = (patient as unknown as { name?: string }).name ?? patient.user?.name;

  function startEdit() {
    setDraft({
      gender: patient!.gender || "",
      bloodType: patient!.bloodType || "",
      allergies: (patient!.allergies || []).join(", "),
      preferredLanguage: patient!.preferredLanguage || "en",
      emergencyContactName: patient!.emergencyContactName || "",
      emergencyContactPhone: patient!.emergencyContactPhone || "",
      phone: patient!.phone || "",
    });
    setEditing(true);
  }

  function handleSave() {
    const allergiesStr = draft.allergies as string;
    updateProfile.mutate(
      {
        ...draft,
        allergies: allergiesStr
          ? allergiesStr.split(",").map((a: string) => a.trim()).filter(Boolean)
          : [],
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  const fields = [
    { label: t("profile.dob"), value: formatDateDE(patient.dob, locale) },
    { label: t("profile.gender"), value: patient.gender ? t(`gender.${patient.gender}`) : "—", key: "gender" },
    { label: t("profile.blood_type"), value: patient.bloodType || "—", key: "bloodType" },
    { label: t("profile.language"), value: patient.preferredLanguage || "en", key: "preferredLanguage" },
    { label: t("profile.phone"), value: patient.phone || "—", key: "phone" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16 text-lg">
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl">{name || "Patient"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("profile.dob")} {formatDateDE(patient.dob, locale)}
            {patient.bloodType && ` · ${t("profile.blood_type")} ${patient.bloodType}`}
          </p>
        </div>
        {canEdit && !editing && (
          <Button variant="outline" size="sm" onClick={startEdit}>
            {t("profile.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
              {t("btn.save")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              {t("btn.cancel")}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-sm font-medium text-muted-foreground">{t("profile.allergies")}</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {editing ? (
              <Input
                value={draft.allergies as string}
                onChange={(e) => setDraft({ ...draft, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Latex"
                className="max-w-md"
              />
            ) : patient.allergies && patient.allergies.length > 0 ? (
              patient.allergies.map((a: string) => (
                <Badge
                  key={a}
                  className="bg-red-100 text-red-800 border-red-200"
                  aria-label={`Allergy: ${a}`}
                >
                  {a}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{t("profile.allergies_none")}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <div key={f.label}>
              <label className="text-sm font-medium text-muted-foreground">{f.label}</label>
              {editing && f.key ? (
                <Input
                  value={(draft[f.key] as string) || ""}
                  onChange={(e) => setDraft({ ...draft, [f.key!]: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm">{f.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-md border p-3">
          <span className="text-sm font-medium text-muted-foreground">{t("profile.emergency")}</span>
          {editing ? (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                value={(draft.emergencyContactName as string) || ""}
                onChange={(e) => setDraft({ ...draft, emergencyContactName: e.target.value })}
                placeholder="Name"
              />
              <Input
                value={(draft.emergencyContactPhone as string) || ""}
                onChange={(e) => setDraft({ ...draft, emergencyContactPhone: e.target.value })}
                placeholder="Phone"
              />
            </div>
          ) : (
            <p className="mt-1 text-sm">
              {patient.emergencyContactName || "—"}
              {patient.emergencyContactPhone && ` · ${patient.emergencyContactPhone}`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
