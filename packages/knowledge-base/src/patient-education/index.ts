export type { PatientEducationDocument } from "./types";
export { nhsChestPain } from "./nhs-chest-pain";
export { symptomTopics } from "./symptoms";
export { conditionTopics } from "./conditions";
export { medicationTopics } from "./medications";

import { nhsChestPain } from "./nhs-chest-pain";
import { conditionTopics } from "./conditions";
import { medicationTopics } from "./medications";
import { symptomTopics } from "./symptoms";

/** All bundled patient-education articles for seeding the knowledge base. */
export const PATIENT_EDUCATION_DOCUMENTS = [
  nhsChestPain,
  ...symptomTopics,
  ...conditionTopics,
  ...medicationTopics,
];
