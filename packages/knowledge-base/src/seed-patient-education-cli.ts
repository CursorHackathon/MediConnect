import { prisma } from "@mediconnect/db";

import { seedPatientEducationKnowledge } from "./seed-patient-education";

void seedPatientEducationKnowledge()
  .then((r) => {
    console.log(`Patient education seed OK: ${r.documents} documents, ${r.chunks} chunks embedded.`);
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
