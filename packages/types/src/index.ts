import type {
  Appointment as PrismaAppointment,
  Doctor as PrismaDoctor,
  DoctorNote as PrismaDoctorNote,
  Insurance as PrismaInsurance,
  KnowledgeChunk as PrismaKnowledgeChunk,
  MedicalHistory as PrismaMedicalHistory,
  MedicalHistoryAttachment as PrismaMedicalHistoryAttachment,
  Medication as PrismaMedication,
  MedicationAdministration as PrismaMedicationAdministration,
  Patient as PrismaPatient,
  PatientDoctor as PrismaPatientDoctor,
  Role,
  StikoScheduleRule as PrismaStikoScheduleRule,
  User as PrismaUser,
  Vaccination as PrismaVaccination,
} from "@prisma/client";

export type {
  InsuranceType,
  Role,
  VaccinationStatus,
  VisitType,
} from "@prisma/client";

export interface User extends PrismaUser {}

export interface Patient extends PrismaPatient {
  hasActiveInsurance?: boolean;
}

export interface Doctor extends PrismaDoctor {
  displayName?: string;
}

export interface Appointment extends PrismaAppointment {}

export interface MedicalHistory extends PrismaMedicalHistory {}

export interface MedicalHistoryAttachment extends PrismaMedicalHistoryAttachment {}

export interface Vaccination extends PrismaVaccination {}

export interface StikoScheduleRule extends PrismaStikoScheduleRule {}

export interface Medication extends PrismaMedication {}

export interface MedicationAdministration extends PrismaMedicationAdministration {}

export interface Insurance extends PrismaInsurance {}

export interface PatientDoctor extends PrismaPatientDoctor {}

export interface DoctorNote extends PrismaDoctorNote {}

export interface KnowledgeChunk extends PrismaKnowledgeChunk {
  embeddingVector?: number[];
}

export type UserWithRelations = User & {
  patient?: Patient | null;
  doctor?: Doctor | null;
};

export type PatientWithMedical = Patient & {
  user?: User;
  medicalHistories?: MedicalHistoryWithDoctor[];
  vaccinations?: VaccinationWithDoctor[];
  medications?: MedicationWithDoctor[];
  insurances?: Insurance[];
};

export type MedicalHistoryWithDoctor = MedicalHistory & {
  attendingDoctor?: (Doctor & { user?: User }) | null;
  attachments?: MedicalHistoryAttachment[];
};

export type VaccinationWithDoctor = Vaccination & {
  administeringDoctor?: (Doctor & { user?: User }) | null;
};

export type MedicationWithDoctor = Medication & {
  prescribedBy?: (Doctor & { user?: User }) | null;
  administrations?: MedicationAdministration[];
};

export type AppointmentWithParticipants = Appointment & {
  patient?: Patient;
  doctor?: Doctor | null;
};
