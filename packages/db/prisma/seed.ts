import { hash } from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("mediconnect-dev", 10);

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

  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@mediconnect.local" },
    update: { passwordHash, name: "Dr. Demo", role: Role.DOCTOR },
    create: {
      email: "doctor@mediconnect.local",
      name: "Dr. Demo",
      role: Role.DOCTOR,
      passwordHash,
    },
  });

  let doctor = await prisma.doctor.findUnique({ where: { userId: doctorUser.id } });
  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        specialty: "General practice",
        licenseNumber: "DE-DEMO-001",
      },
    });
  }

  const patientUser = await prisma.user.upsert({
    where: { email: "patient@mediconnect.local" },
    update: { passwordHash, name: "Patient Demo", role: Role.PATIENT },
    create: {
      email: "patient@mediconnect.local",
      name: "Patient Demo",
      role: Role.PATIENT,
      passwordHash,
    },
  });

  let patient = await prisma.patient.findUnique({ where: { userId: patientUser.id } });
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        userId: patientUser.id,
        phone: "+49 30 00000000",
      },
    });
  }

  const existing = await prisma.appointment.findFirst({
    where: { patientId: patient.id, doctorId: doctor.id },
  });
  if (!existing) {
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 86400000 + 3600000),
        status: "SCHEDULED",
      },
    });
  }

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

  console.log("Seed completed. Dev password for seeded users: mediconnect-dev");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
