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

export const medicationTopics: PatientEducationDocument[] = [
  mp(
    "How to read a prescription label",
    "prescriptiondrugmisuse.html",
    `
Prescription labels tell you the medicine name, strength, how much to take, how often, and for how long. They may warn about driving, alcohol, or taking with food.

The pharmacy leaflet lists common side effects and serious warning signs — read it when you start something new.

“Generic” medicines have the same active ingredient as brand names but may look different — ask your pharmacist if unsure.

Do not share prescriptions. Do not take old antibiotics “just in case.”

If a label is unclear, ask the pharmacist before leaving — they can explain in plain language.

Keep a current list of all medicines and supplements for every clinic visit.

This supports health literacy — your pharmacist and doctor answer questions specific to you.
`.trim(),
  ),
  mp(
    "Common side effects — what's normal, what to report",
    "drugreactions.html",
    `
Many medicines can cause mild effects that improve with time, such as mild stomach upset or drowsiness when starting a new drug.

Call emergency services for throat or tongue swelling, trouble breathing, widespread rash with fever, or severe sudden illness after a new medicine.

Tell your prescriber soon for new chest pain, yellowing eyes or skin, dark urine, severe rash, confusion, or bleeding that is not normal for you.

Do not stop essential medicines without medical advice — sometimes dose timing or alternatives exist.

“Side effect” means any unintended effect; “allergy” is a specific immune reaction — not all side effects are allergies.

Keep notes on when symptoms started relative to new drugs — it helps clinicians.

Always report concerns — this text cannot judge severity for your situation.
`.trim(),
  ),
  mp(
    "Drug interactions — things not to mix",
    "druginteractions.html",
    `
Interactions happen when one substance changes how another works — raising side effects or lowering effectiveness. They can involve prescription drugs, over-the-counter medicines, alcohol, grapefruit, and herbal products.

Examples: some pain relievers with blood thinners increase bleeding risk; certain cold medicines with high blood pressure pills can be risky; alcohol with sedatives increases drowsiness and overdose risk.

Use one pharmacy when possible so checks overlap. Read labels on OTC products — many contain multiple ingredients.

“OTC” means over the counter — available without prescription but not always harmless.

Bring a full medication list to appointments. Ask “Does this new prescription interact with what I already take?”

A clinician or pharmacist should review your personal combination — automated lists miss context.

This is education, not a check of your exact regimen.
`.trim(),
  ),
  mp(
    "Paracetamol / Ibuprofen — correct dosing",
    "painrelievers.html",
    `
Paracetamol (acetaminophen) and ibuprofen are common pain and fever reducers. Dosing depends on age, weight, kidney function, and other health issues.

Paracetamol overdose can seriously harm the liver — never exceed the maximum daily amount on the label and watch for hidden paracetamol in combination cold products.

Ibuprofen (an NSAID) can irritate the stomach and affect kidneys; it may be unsuitable for some heart or kidney patients — ask a clinician if unsure.

Take ibuprofen with food for stomach comfort unless told otherwise.

Children need weight-based dosing — use the measuring device provided, not kitchen spoons.

If pain or fever lasts beyond label directions, see a doctor rather than increasing dose on your own.

Always follow local product labels and your pharmacist’s advice.
`.trim(),
  ),
  mp(
    "Antibiotics — why you must finish the course",
    "antibiotics.html",
    `
Antibiotics treat bacterial infections, not viruses like most colds. Taking them when not needed drives antibiotic resistance — germs learn to survive drugs.

When prescribed for a true bacterial infection, take the full course as directed even if you feel better early — stopping early can leave surviving bacteria that are harder to treat.

Side effects include stomach upset and yeast infections; serious allergy is possible — seek care for rash with breathing problems.

Never share antibiotics or use leftovers without medical review.

“Resistance” means bacteria no longer killed by an antibiotic — a public health problem.

Your doctor chooses type and length based on infection site and severity.

Trust prescribed duration — do not adjust based on internet advice alone.
`.trim(),
  ),
  mp(
    "Blood pressure medications — what to expect",
    "bloodpressuremedicines.html",
    `
Blood pressure medicines include diuretics (“water pills”), ACE inhibitors, ARBs, calcium channel blockers, beta blockers, and others. Each works differently and has different side effect profiles.

Common effects can include dizziness when standing (especially at first), dry cough with some ACE inhibitors, ankle swelling with some calcium channel blockers, or tiredness with beta blockers — report bothersome effects; alternatives often exist.

Do not stop blood pressure drugs suddenly without medical advice — rebound high pressure can occur.

Home blood pressure readings help tuning — bring a log to visits.

“ACE inhibitor” and “ARB” both affect a hormone system that tightens vessels — names often end in -pril or -sartan.

Kidney function and potassium are monitored on some drugs.

Personalised prescribing is essential — this overview does not replace your clinician.
`.trim(),
  ),
  mp(
    "Metformin for diabetes — patient guidelines",
    "metformin.html",
    `
Metformin is a common first medicine for type 2 diabetes. It mainly lowers liver sugar production and helps insulin work better. It does not usually cause dangerous low blood sugar when used alone.

Common side effects: stomach upset, diarrhoea — often improved by taking with meals or using extended-release forms as prescribed.

Rare but serious: lactic acid buildup, especially if kidneys are impaired or during severe illness — seek urgent care for severe weakness, trouble breathing, or confusion when on metformin.

Alcohol binges and dehydration raise risk — discuss safe limits with your clinician.

Providers may pause metformin before some scans with contrast dye — follow their instructions.

“Type 2 diabetes” is the usual setting for metformin; other types need different plans.

Never change diabetes medicines without your prescriber’s guidance.
`.trim(),
  ),
];
