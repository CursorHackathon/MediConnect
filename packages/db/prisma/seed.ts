import { hash } from "bcryptjs";
import {
  AppointmentStatus,
  InsuranceType,
  PrismaClient,
  Role,
  VaccinationStatus,
  VisitType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("mediconnect-dev", 10);

  // ─── Admin ────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@mediconnect.local" },
    update: { passwordHash, name: "Admin User", role: Role.ADMIN },
    create: {
      email: "admin@mediconnect.local",
      name: "Admin User",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  // ─── Doctor ───────────────────────────────────────
  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@mediconnect.local" },
    update: { passwordHash, name: "Dr. Mueller", role: Role.DOCTOR },
    create: {
      email: "doctor@mediconnect.local",
      name: "Dr. Mueller",
      role: Role.DOCTOR,
      passwordHash,
    },
  });

  let doctor = await prisma.doctor.findUnique({ where: { userId: doctorUser.id } });
  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        specialty: "Allgemeinmedizin",
        licenseNumber: "DE-BW-2024-001",
        languages: ["de", "en"],
      },
    });
  }

  // ─── Nurse ────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "nurse@mediconnect.local" },
    update: { passwordHash, name: "Nurse Schmidt", role: Role.NURSE },
    create: {
      email: "nurse@mediconnect.local",
      name: "Nurse Schmidt",
      role: Role.NURSE,
      passwordHash,
    },
  });

  // ─── Patient ──────────────────────────────────────
  const patientUser = await prisma.user.upsert({
    where: { email: "patient@mediconnect.local" },
    update: { passwordHash, name: "Max Weber", role: Role.PATIENT },
    create: {
      email: "patient@mediconnect.local",
      name: "Max Weber",
      role: Role.PATIENT,
      passwordHash,
    },
  });

  let patient = await prisma.patient.findUnique({ where: { userId: patientUser.id } });
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        userId: patientUser.id,
        dob: new Date("1985-03-15"),
        phone: "+49 711 00000000",
        gender: "male",
        bloodType: "A+",
        allergies: ["Penicillin"],
        preferredLanguage: "de",
        emergencyContactName: "Maria Weber",
        emergencyContactPhone: "+49 711 00000001",
      },
    });
  }

  // ─── PatientDoctor assignment ─────────────────────
  await prisma.patientDoctor.upsert({
    where: { patientId_doctorId: { patientId: patient.id, doctorId: doctor.id } },
    update: {},
    create: {
      patientId: patient.id,
      doctorId: doctor.id,
      isPrimary: true,
    },
  });

  // ─── Doctor availability (E3) ─────────────────────
  await prisma.doctorAvailabilityRule.deleteMany({ where: { doctorId: doctor.id } });
  await prisma.doctorAvailabilityRule.createMany({
    data: [
      { doctorId: doctor.id, weekday: 1, slotDurationMinutes: 30, startTime: "09:00", endTime: "12:00" },
      { doctorId: doctor.id, weekday: 2, slotDurationMinutes: 30, startTime: "09:00", endTime: "12:00" },
      { doctorId: doctor.id, weekday: 3, slotDurationMinutes: 30, startTime: "14:00", endTime: "17:00" },
      { doctorId: doctor.id, weekday: 4, slotDurationMinutes: 15, startTime: "10:00", endTime: "11:00" },
    ],
  });

  // ─── Appointment (sample) ───────────────────────
  const existingAppt = await prisma.appointment.findFirst({
    where: { patientId: patient.id, doctorId: doctor.id },
  });
  if (!existingAppt) {
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        startsAt: new Date(Date.now() + 86_400_000),
        endsAt: new Date(Date.now() + 86_400_000 + 3_600_000),
        status: AppointmentStatus.SCHEDULED,
        videoRoomUrl: "https://video.mediconnect.local/room/seed-demo",
      },
    });
  }

  // ─── Medical History (3 entries) ──────────────────
  const histories = [
    {
      condition: "Hypertonie",
      icd10Code: "I10",
      icd10Name: "Essentielle (primäre) Hypertonie",
      visitType: VisitType.DIAGNOSIS,
      diagnosedAt: new Date("2023-01-15"),
      notes: "Blutdruck bei Erstdiagnose: 160/95 mmHg. Medikamentöse Therapie eingeleitet.",
    },
    {
      condition: "Appendektomie",
      icd10Code: "K35.8",
      icd10Name: "Akute Appendizitis, sonstige und nicht näher bezeichnet",
      visitType: VisitType.SURGERY,
      diagnosedAt: new Date("2020-06-20"),
      notes: "Laparoskopische Appendektomie ohne Komplikationen.",
    },
    {
      condition: "COVID-19",
      icd10Code: "U07.1",
      icd10Name: "COVID-19, Virus nachgewiesen",
      visitType: VisitType.DIAGNOSIS,
      diagnosedAt: new Date("2022-12-01"),
      notes: "Milder Verlauf, häusliche Isolation.",
    },
  ];
  for (const h of histories) {
    const exists = await prisma.medicalHistory.findFirst({
      where: { patientId: patient.id, icd10Code: h.icd10Code },
    });
    if (!exists) {
      await prisma.medicalHistory.create({
        data: { patientId: patient.id, attendingDoctorId: doctor.id, ...h },
      });
    }
  }

  // ─── Vaccinations (4 entries) ─────────────────────
  const vaccinations = [
    {
      name: "Tetanus",
      administeredAt: new Date("2024-01-10"),
      batch: "TE-2024-001",
      nextDueDate: new Date("2034-01-10"),
      status: VaccinationStatus.UP_TO_DATE,
    },
    {
      name: "Influenza",
      administeredAt: new Date("2024-10-15"),
      batch: "FL-2024-003",
      nextDueDate: new Date("2025-10-15"),
      status: VaccinationStatus.OVERDUE,
    },
    {
      name: "COVID-19 Booster",
      administeredAt: new Date("2023-09-01"),
      batch: "CV-2023-005",
      nextDueDate: new Date("2024-09-01"),
      status: VaccinationStatus.OVERDUE,
    },
    {
      name: "Hepatitis B",
      administeredAt: new Date("2024-06-01"),
      batch: "HB-2024-002",
      nextDueDate: new Date("2034-06-01"),
      status: VaccinationStatus.UP_TO_DATE,
    },
  ];
  for (const v of vaccinations) {
    const exists = await prisma.vaccination.findFirst({
      where: { patientId: patient.id, name: v.name },
    });
    if (!exists) {
      await prisma.vaccination.create({
        data: { patientId: patient.id, administeringDoctorId: doctor.id, ...v },
      });
    }
  }

  // ─── Medications (2 active) ───────────────────────
  const medications = [
    {
      name: "Ramipril",
      dosage: "5 mg",
      frequency: "ONCE_DAILY",
      route: "oral",
      startDate: new Date("2023-01-15"),
    },
    {
      name: "Metformin",
      dosage: "500 mg",
      frequency: "TWICE_DAILY",
      route: "oral",
      startDate: new Date("2023-06-01"),
    },
  ];
  for (const m of medications) {
    const exists = await prisma.medication.findFirst({
      where: { patientId: patient.id, name: m.name },
    });
    if (!exists) {
      await prisma.medication.create({
        data: {
          patientId: patient.id,
          prescribedById: doctor.id,
          isActive: true,
          ...m,
        },
      });
    }
  }

  // ─── Insurance (TK, GKV) ─────────────────────────
  const existingInsurance = await prisma.insurance.findFirst({
    where: { patientId: patient.id, providerName: "Techniker Krankenkasse" },
  });
  if (!existingInsurance) {
    await prisma.insurance.create({
      data: {
        patientId: patient.id,
        providerName: "Techniker Krankenkasse",
        policyNumber: "TK-123456789",
        type: InsuranceType.GKV,
        coverageTier: "Standard",
        coPayAmount: 10.0,
        insurerWebsiteUrl: "https://www.tk.de",
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2026-12-31"),
      },
    });
  }

  // ─── STIKO Schedule Rules (subset) ────────────────
  const stikoRules = [
    { vaccineKey: "tetanus", vaccineName: "Tetanus", dosesRequired: 1, intervalDays: 3650, notes: "Auffrischung alle 10 Jahre" },
    { vaccineKey: "diphtherie", vaccineName: "Diphtherie", dosesRequired: 1, intervalDays: 3650, notes: "Auffrischung alle 10 Jahre" },
    { vaccineKey: "pertussis", vaccineName: "Pertussis", dosesRequired: 1, intervalDays: 3650, notes: "Auffrischung alle 10 Jahre" },
    { vaccineKey: "influenza", vaccineName: "Influenza", dosesRequired: 1, intervalDays: 365, ageFromMonths: 720, notes: "Jährlich ab 60 Jahren" },
    { vaccineKey: "covid19", vaccineName: "COVID-19", dosesRequired: 1, intervalDays: 365, notes: "Jährliche Auffrischung empfohlen" },
    { vaccineKey: "hepatitisb", vaccineName: "Hepatitis B", dosesRequired: 3, intervalDays: 3650, ageFromMonths: 0, ageToMonths: 216, notes: "Grundimmunisierung im Kindesalter" },
    { vaccineKey: "masern", vaccineName: "Masern", dosesRequired: 2, ageFromMonths: 11, ageToMonths: 23, notes: "2 Dosen im Kindesalter" },
    { vaccineKey: "fsme", vaccineName: "FSME", dosesRequired: 3, intervalDays: 1825, notes: "Auffrischung alle 5 Jahre in Risikogebieten" },
  ];
  for (const rule of stikoRules) {
    await prisma.stikoScheduleRule.upsert({
      where: { vaccineKey: rule.vaccineKey },
      update: rule,
      create: rule,
    });
  }

  // ─── Knowledge Chunk ──────────────────────────────
  const existingChunk = await prisma.knowledgeChunk.findFirst({
    where: { source: "seed" },
  });
  if (!existingChunk) {
    await prisma.knowledgeChunk.create({
      data: {
        source: "seed",
        content: "MediConnect seed knowledge chunk for RAG development.",
        metadata: { purpose: "bootstrap" },
      },
    });
  }

  console.log("Seed completed. Sign in at each app’s /login with patient@, doctor@, or admin@mediconnect.local.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
