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

export const conditionTopics: PatientEducationDocument[] = [
  mp(
    "High blood pressure — what it is, lifestyle changes",
    "highbloodpressure.html",
    `
Blood pressure is the force of blood against artery walls. High blood pressure (hypertension) usually has no symptoms but raises risk of stroke, heart attack, and kidney damage over time.

Home monitoring and clinic checks help track trends. Goals depend on age and other conditions — your clinician sets your target.

Lifestyle steps that often help:
- Reduce salt, eat more vegetables and whole grains, limit alcohol.
- Regular physical activity as approved by your doctor.
- Maintain a healthy weight and sleep well.
- Stop smoking.

Medicines are often needed long term — take them as prescribed and discuss side effects rather than stopping on your own.

“Systolic” is the top number (pressure when the heart beats); “diastolic” is the bottom (pressure between beats).

Always follow your care team’s plan — this is education, not treatment changes.
`.trim(),
  ),
  mp(
    "Diabetes Type 2 — symptoms, diet, monitoring",
    "diabetestype2.html",
    `
Type 2 diabetes means the body resists insulin or does not make enough, so blood sugar runs high. Over time high sugar damages nerves, eyes, kidneys, and blood vessels.

Symptoms can include thirst, frequent urination, tiredness, blurred vision, slow-healing sores — but many people have no symptoms at first.

See a doctor for testing if you have risk factors: family history, overweight, sedentary lifestyle, prior gestational diabetes, or age over 45.

Management often combines food planning, activity, weight care, and medicines including possibly insulin.

“Blood glucose” is sugar in the blood. “HbA1c” reflects average sugar over about three months.

Work with clinicians and dietitians for a plan that fits your culture and health — do not change prescriptions without medical advice.
`.trim(),
  ),
  mp(
    "Asthma — triggers, inhaler use, action plans",
    "asthma.html",
    `
Asthma causes airway swelling and tightening, leading to wheeze, cough, chest tightness, and shortness of breath. Triggers include colds, pollen, dust, smoke, exercise, cold air, and stress.

Rescue inhalers (often blue) relax muscles around airways quickly — use as your plan describes.

Controller inhalers reduce inflammation daily even when you feel well — skipping them increases flare risk.

An “asthma action plan” written with your clinician explains daily meds and what to do if symptoms worsen.

Call emergency services for severe breathlessness, blue lips, or no relief from rescue inhaler after proper use.

Technique matters: spacers can improve delivery — ask a nurse or pharmacist to check your inhaler use.

This is education — your doctor personalizes treatment.
`.trim(),
  ),
  mp(
    "Anxiety and stress",
    "anxiety.html",
    `
Anxiety is worry or fear that feels hard to control. Physical signs can include fast heartbeat, shaking, sweating, stomach upset, and trouble sleeping. Stress from life events can trigger or worsen it.

Self-care that helps many people: regular sleep, movement, limiting caffeine and alcohol, breathing exercises, and talking with trusted people.

See a clinician if anxiety blocks work or relationships, causes panic attacks, or lasts weeks. Therapy (such as CBT) and sometimes medicines are effective.

“Panic attack” is a sudden surge of fear with strong body symptoms — it is scary but not usually dangerous; still discuss with a doctor.

If you have thoughts of harming yourself, seek urgent help from local crisis services or emergency lines.

Mental health conditions are medical — professional support is appropriate.
`.trim(),
  ),
  mp(
    "Depression — recognising it, getting help",
    "depression.html",
    `
Depression is more than a bad day. It can mean low mood most of the time, loss of interest, poor sleep or oversleeping, low energy, guilt feelings, trouble concentrating, or appetite changes — for at least two weeks.

See a doctor or mental health professional if these symptoms affect your life. Treatment can include talk therapy, medicines, or both.

If you think of hurting yourself or suicide, contact emergency or crisis services immediately — you deserve urgent support.

“Seasonal depression” follows a winter pattern; “postpartum depression” occurs after childbirth — both warrant clinical care.

Recovery is possible. Do not wait silently — reach out to healthcare providers you trust.

This text supports learning, not crisis counselling — use local emergency numbers in a crisis.
`.trim(),
  ),
  mp(
    "Common cold vs flu vs COVID — how to tell the difference",
    "commoncold.html",
    `
Colds are usually mild: runny nose, sneezing, sore throat, mild cough. Flu often hits harder with fever, body aches, headache, and fatigue. COVID can look like either and needs testing to confirm.

Call emergency services for trouble breathing, blue lips, chest pain, confusion, or inability to stay awake.

Rest, fluids, and fever reducers (if safe for you) help symptoms. Antibiotics do not cure viruses.

Vaccines reduce serious outcomes for flu and COVID — ask your clinician what is recommended for your age and health.

Because symptoms overlap, testing and public health guidance change over time — follow current advice from your national or local health authority.

Always isolate and seek guidance if you might spread a serious respiratory virus to vulnerable people.

See a clinician for high-risk groups, worsening symptoms, or uncertainty.
`.trim(),
  ),
  mp(
    "Urinary tract infections (UTI)",
    "urinarytractinfections.html",
    `
A UTI is infection in the urinary system. Typical signs: burning when passing urine, going often in small amounts, cloudy or strong-smelling urine, lower belly pressure. Kidney infection can add fever, back pain, and feeling very unwell.

See a clinician for diagnosis and antibiotics when bacterial UTI is confirmed — untreated kidney infections can be dangerous.

Drink fluids as advised; cranberry products are not a reliable cure.

Women are more prone to bladder infections; pregnancy, blockages, catheters, and some conditions raise risk for anyone.

Finish antibiotics as prescribed unless your prescriber tells you otherwise.

If symptoms return quickly, tell your doctor — further testing may be needed.

This is general information, not a substitute for urine tests and exam.
`.trim(),
  ),
  mp(
    "Acid reflux and heartburn",
    "gerd.html",
    `
Heartburn is a burning feeling rising from the stomach toward the throat. Reflux means stomach acid flows back into the food pipe (oesophagus). Occasional reflux is common; frequent symptoms may be GERD.

Lifestyle tips that help some people: smaller meals, not lying down soon after eating, raising the head of the bed, weight reduction if advised, avoiding trigger foods like spicy or fatty meals, limiting alcohol.

Medicines such as antacids, H2 blockers, or proton pump inhibitors exist — use under guidance because long-term use needs review.

See a doctor for trouble swallowing, weight loss, vomiting blood, black stools, or symptoms despite treatment.

“GERD” stands for gastro-oesophageal reflux disease — ongoing reflux causing symptoms or inflammation.

Persistent symptoms warrant medical assessment to rule out other conditions.
`.trim(),
  ),
  mp(
    "Allergies — food, seasonal, medication",
    "allergies.html",
    `
Allergies happen when the immune system reacts to a usually harmless substance. Hay fever causes sneezing and itchy eyes from pollen. Food allergy can cause hives, swelling, vomiting, or breathing problems. Drug allergy can cause rashes or severe reactions.

Anaphylaxis is a severe whole-body allergic reaction — use prescribed adrenaline if you have it and call emergency services.

See an allergist for testing if reactions are unclear or severe. Read food labels carefully if you have diagnosed food allergy.

“Antihistamines” block histamine, a chemical released in allergic reactions — they help mild symptoms but not severe breathing problems alone.

Carry emergency plans and devices if your clinician prescribes them.

Always follow personalised allergy advice from your healthcare team.
`.trim(),
  ),
  mp(
    "Insomnia and sleep problems",
    "insomnia.html",
    `
Insomnia means trouble falling or staying asleep, or waking too early, with daytime tiredness. Causes include stress, shift work, caffeine, alcohol, pain, breathing disorders like sleep apnoea, depression, and medicines.

Sleep hygiene basics: fixed wake time, wind-down routine, cool dark room, no screens in bed, limit late caffeine, exercise earlier in the day.

See a doctor if you snore loudly and stop breathing at night, or if insomnia lasts months — sleep apnoea and mood disorders are treatable.

CBT for insomnia is a first-line talk therapy for chronic insomnia in many guidelines.

Sleeping pills may be short term tools — discuss risks of dependence and next-day grogginess with your prescriber.

Seek professional assessment before long-term self-medication for sleep.
`.trim(),
  ),
];
