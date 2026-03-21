"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mediconnect/ui";

import { useTranslation } from "@/app/lib/i18n";
import { PatientProfileCard } from "./patient-profile-card";
import { MedicalHistoryTimeline } from "./medical-history-timeline";
import { VaccinationTable } from "./vaccination-table";
import { MedicationsList } from "./medications-list";
import { InsurancePanel } from "./insurance-panel";

type Props = {
  patientId: string;
  role: string;
};

export function DashboardShell({ patientId, role }: Props) {
  const { t } = useTranslation();
  const isDoctor = role === "DOCTOR" || role === "ADMIN";
  const isNurse = role === "NURSE";
  const isPatient = role === "PATIENT";

  if (isNurse) {
    return (
      <Tabs defaultValue="profil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profil">{t("tab.profile")}</TabsTrigger>
          <TabsTrigger value="medikamente">{t("tab.medications")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <PatientProfileCard patientId={patientId} />
        </TabsContent>

        <TabsContent value="medikamente">
          <MedicationsList patientId={patientId} canEdit={false} isNurse />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <Tabs defaultValue="profil" className="space-y-4">
      <TabsList>
        <TabsTrigger value="profil">{t("tab.profile")}</TabsTrigger>
        <TabsTrigger value="krankengeschichte">{t("tab.history")}</TabsTrigger>
        <TabsTrigger value="impfungen">{t("tab.vaccinations")}</TabsTrigger>
        <TabsTrigger value="medikamente">{t("tab.medications")}</TabsTrigger>
        <TabsTrigger value="versicherung">{t("tab.insurance")}</TabsTrigger>
      </TabsList>

      <TabsContent value="profil">
        <PatientProfileCard patientId={patientId} canEdit={isPatient} />
      </TabsContent>

      <TabsContent value="krankengeschichte">
        <MedicalHistoryTimeline patientId={patientId} canEdit={isDoctor} />
      </TabsContent>

      <TabsContent value="impfungen">
        <VaccinationTable patientId={patientId} canEdit={isDoctor} isPatient={isPatient} />
      </TabsContent>

      <TabsContent value="medikamente">
        <MedicationsList patientId={patientId} canEdit={isDoctor} isNurse={false} />
      </TabsContent>

      <TabsContent value="versicherung">
        <InsurancePanel patientId={patientId} canEdit={isDoctor} />
      </TabsContent>
    </Tabs>
  );
}
