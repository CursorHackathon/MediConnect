"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Insurance,
  MedicalHistoryWithDoctor,
  MedicationWithDoctor,
  PatientWithMedical,
  VaccinationWithDoctor,
} from "@mediconnect/types";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// ─── Patient Profile ────────────────────────────────

export function usePatientProfile(patientId: string) {
  return useQuery<PatientWithMedical>({
    queryKey: ["patient-profile", patientId],
    queryFn: () => apiFetch(`/api/v1/patients/${patientId}/profile`),
    enabled: !!patientId,
  });
}

export function useUpdateProfile(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/patients/${patientId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient-profile", patientId] }),
  });
}

// ─── Medical History ────────────────────────────────

export function useMedicalHistory(patientId: string) {
  return useQuery<MedicalHistoryWithDoctor[]>({
    queryKey: ["medical-history", patientId],
    queryFn: () => apiFetch(`/api/v1/patients/${patientId}/medical-history`),
    enabled: !!patientId,
  });
}

export function useCreateMedicalHistory(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/patients/${patientId}/medical-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medical-history", patientId] }),
  });
}

// ─── Vaccinations ───────────────────────────────────

export function useVaccinations(patientId: string) {
  return useQuery<VaccinationWithDoctor[]>({
    queryKey: ["vaccinations", patientId],
    queryFn: () => apiFetch(`/api/v1/patients/${patientId}/vaccinations`),
    enabled: !!patientId,
  });
}

export function useCreateVaccination(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/patients/${patientId}/vaccinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vaccinations", patientId] }),
  });
}

// ─── Medications ────────────────────────────────────

export function useMedications(patientId: string) {
  return useQuery<MedicationWithDoctor[]>({
    queryKey: ["medications", patientId],
    queryFn: () => apiFetch(`/api/v1/patients/${patientId}/medications`),
    enabled: !!patientId,
  });
}

export function useCreateMedication(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/patients/${patientId}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medications", patientId] }),
  });
}

export function useAdministerMedication(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      medicationId,
      slotLabel,
    }: {
      medicationId: string;
      slotLabel?: string;
    }) =>
      apiFetch(
        `/api/v1/patients/${patientId}/medications/${medicationId}/administer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotLabel }),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medications", patientId] }),
  });
}

// ─── Insurance ──────────────────────────────────────

export function useInsurance(patientId: string) {
  return useQuery<Insurance[]>({
    queryKey: ["insurance", patientId],
    queryFn: () => apiFetch(`/api/v1/patients/${patientId}/insurance`),
    enabled: !!patientId,
  });
}

export function useCreateInsurance(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/v1/patients/${patientId}/insurance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance", patientId] }),
  });
}

export function useUpdateInsurance(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/v1/patients/${patientId}/insurance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance", patientId] }),
  });
}

// ─── Drug Search ────────────────────────────────────

export function useDrugSearch(query: string) {
  return useQuery<{ name: string }[]>({
    queryKey: ["drug-search", query],
    queryFn: () => apiFetch(`/api/v1/drugs/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}
