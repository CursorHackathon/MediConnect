import type { PatientEducationDocument } from "./types";

const mp = (
  title: string,
  urlPath: string,
  body: string,
): PatientEducationDocument => ({
  title,
  source: "NIH MedlinePlus",
  audience: "patient",
  language: "EN",
  reading_level: "plain_english",
  url: `https://medlineplus.gov/${urlPath}`,
  body: body.trim(),
});

export const symptomTopics: PatientEducationDocument[] = [
  mp(
    "Shortness of breath",
    "breathingproblems.html",
    `
Shortness of breath means it feels hard to get enough air. Causes range from mild (being out of shape, anxiety) to serious (heart or lung problems, blood clots, severe allergic reactions).

Call emergency services now if:
- You suddenly cannot breathe, lips or face turn blue, or you have chest pain with breathlessness.
- You have swelling of the tongue or throat, hives, or faintness after a sting, food, or new medicine (possible severe allergy).
- You cough up blood, or one leg is swollen and painful with new breathlessness (possible blood clot in the lung).

See a doctor soon if breathlessness is new, worse than usual, or happens at rest.

Common terms:
- “Asthma” is tightening of breathing tubes; rescue inhalers relax them.
- “Heart failure” means the heart pumps less well; fluid can back up into the lungs and cause breathlessness when lying flat.

This is general education only — not a diagnosis.
`.trim(),
  ),
  mp(
    "Headache types and when to worry",
    "headache.html",
    `
Most headaches are not dangerous. Tension headaches feel like a band around the head. Migraines often throb on one side, may cause nausea, and bright light or sound can feel worse.

Call emergency services now if:
- “Thunderclap” worst-ever sudden headache.
- Headache with fever, stiff neck, confusion, seizure, weakness, vision loss, or after a head injury.
- New headache in pregnancy with vision changes or swelling (could be high blood pressure).

See a doctor if headaches are new after age 50, keep getting worse, or interfere with daily life.

Pain relievers can help some headaches, but using them too often can cause rebound headaches — ask your clinician for a plan.

Always seek real medical assessment for new or severe symptoms.
`.trim(),
  ),
  mp(
    "Fever — adults and children",
    "fever.html",
    `
A fever means body temperature is higher than normal, often because the body is fighting infection. It is one clue, not a diagnosis by itself.

For babies under 3 months with any fever, seek medical advice promptly.

Call emergency services if someone has fever with severe headache and stiff neck, confusion, trouble breathing, purple spots on the skin, or looks very ill.

See a doctor soon if fever lasts more than three days, is very high, returns often, or comes with burning urination, bad cough, or severe sore throat.

Children: watch drinking, wet diapers, alertness, and breathing. Seizures with fever can happen in young children — get urgent care.

Cool fluids, light clothing, and rest help comfort. Use medicines only as directed on the label or by your clinician.

This is education, not treatment instructions for every situation.
`.trim(),
  ),
  mp(
    "Back pain",
    "backpain.html",
    `
Most back pain improves within a few weeks. It often comes from muscles, joints, or discs strained by lifting, posture, or sudden movement.

Call emergency services if back pain follows a major injury, or with numbness between the legs, trouble controlling bladder or bowels, or severe weakness in the legs.

See a doctor soon for fever with back pain, cancer history, unexplained weight loss, or pain that wakes you every night.

Staying gently active usually helps more than strict bed rest. Heat, careful stretching, and over-the-counter pain relief may help short term — ask a pharmacist or doctor what is safe for you.

“Sciatica” means irritation of a nerve running down the leg, often with tingling or shooting pain.

Get a personalized exam for pain that does not improve or keeps returning.
`.trim(),
  ),
  mp(
    "Stomach pain and cramps",
    "abdominalpain.html",
    `
Belly pain can come from digestion, infection, menstrual cramps, urinary problems, or more serious conditions.

Seek emergency care for sudden severe pain, rigid belly, vomiting blood or black material, black stools, fainting, or pain with high fever and vomiting.

See a doctor soon for pain lasting more than a day or two, pain with burning urination, yellow skin or eyes, or if you might be pregnant.

Gas, constipation, food intolerance, stomach flu, and stress can cause cramps. “Appendicitis” often starts near the belly button then moves to the lower right — it needs urgent medical care.

Do not ignore ongoing symptoms — a clinician can examine you and order tests if needed.
`.trim(),
  ),
  mp(
    "Fatigue and tiredness",
    "fatigue.html",
    `
Everyone feels tired sometimes. Ongoing fatigue can come from poor sleep, stress, low mood, low iron or thyroid problems, diabetes, infections, medicines, or many other causes.

See a doctor if tiredness lasts weeks, you have unintentional weight change, shortness of breath, chest pain, snoring and daytime sleep, or low mood most days.

Good sleep habits: regular schedule, dark cool room, limit screens before bed, avoid large late meals and caffeine late in the day.

“Chronic fatigue” labels are only made after other causes are checked — self-diagnosis is not reliable.

A clinician can review medications, order blood tests, and help you plan next steps.
`.trim(),
  ),
  mp(
    "Dizziness",
    "dizzinessandvertigo.html",
    `
Dizziness can mean lightheadedness (about to faint), imbalance, or vertigo (room spinning).

Call emergency services if dizziness comes with chest pain, severe headache, weakness on one side, trouble speaking, or fainting with injury.

See a doctor soon for new constant vertigo, hearing loss in one ear, or repeated falls.

Inner ear problems, low blood pressure when standing, dehydration, anemia, anxiety, and side effects of medicines are common causes.

“Vertigo” from inner ear crystals often has brief spinning with head turns — a clinician or physiotherapist can suggest repositioning exercises.

Do not drive or climb if you feel unsafe. Get a real evaluation for new or worsening dizziness.
`.trim(),
  ),
  mp(
    "Skin rashes — common types",
    "skinconditions.html",
    `
Rashes can be allergic, infectious, or from chronic skin conditions. Itching, bumps, blisters, scaling, or oozing need context (new medicine? plant contact? fever?).

Seek emergency care for rash with swelling of lips or tongue, trouble breathing, or purple spots that do not fade when pressed.

See a doctor soon for rash with fever, spreading quickly, eye involvement, or painful blisters.

Eczema tends to be dry itchy patches. Hives are raised itchy welts, often allergic. Ringworm is a fungal rash with a ring shape — not a worm.

Avoid scratching to prevent infection. Cool compresses and fragrance-free moisturizer may soothe mild rashes — but get a diagnosis for anything new or widespread.

A clinician may prescribe creams, antihistamines, or other treatment after examining the rash.
`.trim(),
  ),
  mp(
    "Swollen ankles and legs",
    "edema.html",
    `
Swelling in the legs or ankles (edema) can be from standing long hours, hot weather, salt intake, pregnancy, vein problems, heart or kidney issues, or blood clots.

Call emergency services for one leg suddenly swollen, red, and painful, especially with chest pain or breathlessness.

See a doctor for swelling on both sides that is new, or with shortness of breath, weight gain, or less urine.

Raising legs, movement, and compression stockings (if advised) can help some causes — but the right treatment depends on the cause.

“Heart failure” and “kidney disease” can both cause fluid buildup — only testing can tell.

Do not self-diagnose — seek medical assessment for new swelling.
`.trim(),
  ),
];
