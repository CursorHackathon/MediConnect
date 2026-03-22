import type { PatientEducationDocument } from "./types";

/** Example metadata pattern requested for NHS-style attribution (educational summary, not scraped NHS copy). */
export const nhsChestPain: PatientEducationDocument = {
  title: "Chest Pain — When to Worry",
  source: "NHS",
  audience: "patient",
  language: "EN",
  reading_level: "plain_english",
  url: "https://nhs.uk/conditions/chest-pain",
  body: `
Chest pain can have many causes. Some are serious and need emergency care; others are milder. This information is for learning only — it does not replace an exam by a doctor.

When to call emergency services now (for example 911 in the US, 999 in the UK):
- Sudden crushing or squeezing chest pain, especially if it spreads to your arm, jaw, neck, or back.
- Chest pain with shortness of breath, cold sweat, feeling faint, or nausea.
- Chest pain after an injury, or pain so bad you cannot get comfortable.
- New confusion, trouble speaking, weakness on one side of the body, or severe sudden headache with chest symptoms.

These can be signs of a heart attack, a blood clot in the lung, a torn blood vessel, or other emergencies. Do not drive yourself to hospital if you might be having a heart attack — call emergency services.

When to see a doctor soon (same day or urgent care):
- New chest pain that is not severe but keeps coming back.
- Pain when breathing deeply, with fever or cough (could be infection or inflammation of the lung lining).
- Burning pain behind the breastbone after meals or when lying down (often linked to acid reflux, but your doctor should confirm).
- Anxiety and panic can also cause chest tightness and fast breathing — still tell a clinician if symptoms are new or severe.

Less urgent causes (still mention them to your doctor if new):
- Strained chest muscles after lifting or coughing.
- Shingles before the rash appears can cause one-sided burning pain.

Words explained simply:
- “Angina” means chest pain from the heart not getting enough oxygen, often from narrowed heart arteries.
- “Heart attack” means part of the heart muscle is damaged because blood flow was blocked.

Always get a real diagnosis from a licensed clinician. If you are ever unsure whether your pain is an emergency, it is safer to call emergency services.
`.trim(),
};
