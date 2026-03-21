import type {
  Appointment as PrismaAppointment,
  Doctor as PrismaDoctor,
  Insurance as PrismaInsurance,
  KnowledgeChunk as PrismaKnowledgeChunk,
  MedicalHistory as PrismaMedicalHistory,
  Medication as PrismaMedication,
  Patient as PrismaPatient,
  Role,
  User as PrismaUser,
  Vaccination as PrismaVaccination,
} from "@prisma/client";

export type { Role } from "@prisma/client";

/** Application user aligned with Prisma `User`; extend for API/session-specific fields. */
export interface User extends PrismaUser {}

/** Patient profile; Prisma model plus optional convenience flags for UI layers. */
export interface Patient extends PrismaPatient {
  /** True when the patient has at least one active insurance record (computed in services). */
  hasActiveInsurance?: boolean;
}

/** Licensed clinician profile. */
export interface Doctor extends PrismaDoctor {
  /** Display name resolved from linked `User` when joined in queries. */
  displayName?: string;
}

export interface Appointment extends PrismaAppointment {}

export interface MedicalHistory extends PrismaMedicalHistory {}

export interface Vaccination extends PrismaVaccination {}

export interface Medication extends PrismaMedication {}

export interface Insurance extends PrismaInsurance {}

/** Vector/RAG chunk stored for retrieval-augmented workflows. */
export interface KnowledgeChunk extends PrismaKnowledgeChunk {
  /** Normalized embedding as number[] when deserialized from storage. */
  embeddingVector?: number[];
}

export type UserWithRelations = User & {
  patient?: Patient | null;
  doctor?: Doctor | null;
};

export type PatientWithMedical = Patient & {
  medicalHistories?: MedicalHistory[];
  vaccinations?: Vaccination[];
  medications?: Medication[];
  insurances?: Insurance[];
};

export type AppointmentWithParticipants = Appointment & {
  patient?: Patient;
  doctor?: Doctor | null;
};
