export const config = { maxDuration: 60 };

const exercisesData = require("../../data/exercises.json");
const equipmentMap  = require("../../data/equipment_map.json");

const COMPOUND_KEYWORDS = [
  "press", "squat", "deadlift", "row", "pull-up", "chin-up", 
  "push-up", "lunge", "dip", "clean", "snatch", "thruster"
];

// Build filtered exercise name list based on user's equipment
function getExerciseNames(userEquipmentLabels) {
  const PRIORITY = ["barbell","dumbbell","cable","leverage machine","smith machine",
                    "kettlebell","band","resistance band","ez barbell","olympic barbell",
                    "weighted","body weight"];

  const allowed = new Set(["body weight"]);
  (userEquipmentLabels || []).forEach(label => {
    (equipmentMap[label] || []).forEach(eq => allowed.add(eq));
  });

  // Group by (equipment, bodyPart), take top 5 per group (preserves all key exercises)
  const groups = {};
  for (const ex of exercisesData) {
    if (!allowed.has(ex.equipment) || !ex.name) continue;
    const key = `${ex.equipment}|${ex.bodyPart}`;
    if (!groups[key]) groups[key] = [];
    if (groups[key].length < 5) groups[key].push(ex.name);
  }

  // Collect in priority order
  const names = new Set();
  for (const equip of PRIORITY) {
    for (const [key, list] of Object.entries(groups)) {
      if (key.startsWith(equip + "|")) list.forEach(n => names.add(n));
    }
  }

  const compounds = [];
  const isolations = [];

  [...names].forEach(name => {
    const isCompound = COMPOUND_KEYWORDS.some(kw => name.includes(kw));
    // Guard against edge cases like french press
    if (isCompound && !name.includes("french press") && !name.includes("tricep press")) {
      compounds.push(name);
    } else {
      isolations.push(name);
    }
  });

  return { compounds, isolations };
}

// ── TDEE Calculator (Mifflin-St Jeor) ────────────────────────────────
function calculateTDEE(p) {
  const weightKg = p.weightUnit === "lbs"
    ? parseFloat(p.weight || 70) * 0.453592
    : parseFloat(p.weight || 70);
  const heightCm = p.heightUnit === "ft"
    ? parseFloat(p.height || 170) * 30.48
    : parseFloat(p.height || 170);
  const age   = parseInt(p.age)   || 25;
  const days  = parseInt(p.trainingDays) || 3;

  // Mifflin-St Jeor BMR
  const bmr = p.gender === "Female"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  // Activity multiplier
  const job = p.jobType || "sedentary";
  let multiplier;
  if      (job === "active")    multiplier = days >= 5 ? 1.9  : 1.725;
  else if (job === "light")     multiplier = days >= 4 ? 1.55 : 1.375;
  else /* sedentary */          multiplier = days >= 5 ? 1.55 : days >= 3 ? 1.375 : 1.2;

  const tdee = Math.round(bmr * multiplier);
  const adj = { fat_loss: -400, muscle_gain: 300, maintain: 0 }[p.primaryGoal] || 0;
  return { tdee, target: tdee + adj, adj };
}

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

function buildPayload(p) {
  const days          = parseInt(p.trainingDays) || 4;
  const injuries      = (p.injuries || []).filter(x => x && x !== "None").join(", ") || "none";
  const equip         = p.equipmentStr || (p.equipment || []).join(", ") || "standard gym equipment";
  const diet          = (p.dietaryPrefs || []).filter(x => x && x !== "No Restrictions").join(", ") || "no restrictions";
  const loc           = (p.workoutLocation || []).join("/") || "gym";
  const specificDays  = (p.trainingDaysOfWeek || []).join(", ") || null;
  const styleLabel    = { bodybuilding:"Bodybuilding", powerlifting:"Powerlifting", calisthenics:"Calisthenics", cross_training:"Cross-training", general:"General Fitness" }[p.trainingStyle] || "General Fitness";
  const durationLabel = p.sessionDuration || "60 min";

  const equipLabels = [
    ...(p.gymEquipment  || []),
    ...(p.homeEquipment || []),
    ...(p.workoutLocation?.includes("Gym") || p.workoutLocation?.includes("Both") ? ["Full Commercial Gym"] : []),
  ];
  const exerciseNames = getExerciseNames(equipLabels.length ? equipLabels : ["Full Commercial Gym"]);
  const { tdee, target, adj } = calculateTDEE(p);
  const goalLabel = { fat_loss:"fat loss", muscle_gain:"muscle gain", maintain:"maintenance" }[p.primaryGoal] || "maintenance";
  const goal = `${goalLabel} — calculated TDEE: ${tdee} kcal/day, target: ${target} kcal/day (${adj >= 0 ? "+" : ""}${adj} kcal ${adj < 0 ? "deficit" : adj > 0 ? "surplus" : "maintenance"})`;

  const lastWeekPlan     = p.lastWeekPlan     || "None (this is the first week)";
  const lastWeekFeedback = p.lastWeekFeedback
    ? `Difficulty: ${p.lastWeekFeedback.difficulty}, Energy: ${p.lastWeekFeedback.energy}, Completed workouts: ${p.lastWeekFeedback.completedWorkouts} of ${days}`
    : "None (this is the first week)";

  const lastWeekEdits = Array.isArray(p.lastWeekEdits) && p.lastWeekEdits.length > 0
    ? p.lastWeekEdits.map(e => {
        if (e.type === "swap")    return `• User swapped "${e.from}" for "${e.to}" (${e.day}, ${e.block})`;
        if (e.type === "add")     return `• User added "${e.to}" (${e.day}, ${e.block})`;
        if (e.type === "remove")  return `• User removed "${e.from}" (${e.day}, ${e.block})`;
        if (e.type === "reorder") return `• User reordered: ${e.note} (${e.day})`;
        if (e.type === "edit")    return `• User edited exercise on ${e.day} (${e.block})`;
        return null;
      }).filter(Boolean).join("\n")
    : null;

  const systemInstruction = `You are an elite fitness coach designing a personalized weekly training and nutrition plan.
COACHING PHILOSOPHY — Apply these principles to every decision:
- Think like a real coach, not a template generator. Every exercise, set, and rep range must fit this specific person.
- Prioritize sustainability over perfection. A plan the user can stick to beats an optimal plan they abandon.
- Avoid extreme or unrealistic programming. No 2-hour sessions for beginners. Honor their max session duration.
- Every decision must have a reason. Volume, exercise choice, and progression should be deliberate and coherent — not random.
- Nutrition should be practical. Provide 4-5 non-generic meal examples (breakfast, lunch, dinner, snack, pre/post workout).
- Be realistic with meal prep: incorporate batch-prepped proteins, simple carb sources, and leftovers to make the diet achievable.`;

  const prompt = `User Profile:
- Age: ${p.age}yr, Gender: ${p.gender}, Weight: ${p.weight}${p.weightUnit || "kg"}, Height: ${p.height}${p.heightUnit || "cm"}
- Fitness Level: ${p.fitnessLevel || "beginner"}
- Goal: ${goalLabel}
- Calorie Target: ${target} kcal/day (TDEE: ${tdee}, adjustment: ${adj >= 0 ? "+" : ""}${adj})
- Training Days: ${days} days/week${specificDays ? ' on ' + specificDays : ''}
- Training Style: ${styleLabel}
- Max Session Duration: ${durationLabel}
- Location: ${loc}
- Available Equipment: ${equip}
- Injuries / Limitations: ${injuries}
- Diet Preference: ${diet}
- Sleep: ${p.sleepHours || "7"} hrs/night
- Stress Level: ${p.stressLevel || "medium"}
- Job Type: ${p.jobType || "sedentary"}

Previous Week Summary:
- Last Week Plan: ${lastWeekPlan}
- Last Week Feedback: ${lastWeekFeedback}${lastWeekEdits ? `

User's Previous-Week Edits — These are deliberate preferences:
${lastWeekEdits}

IMPORTANT: Honor these preferences in the new plan. If the user swapped X for Y, prefer Y in the same block/day. If they removed an exercise, avoid bringing it back unless absolutely necessary. If they added an exercise, keep it (or a close variant) in the rotation.` : ""}

---

COACHING INSTRUCTIONS

Design a 7-day plan that mimics a real coach:

1. Weekly Structure:
- Exactly 7 days total, ordered Sunday through Saturday (Sunday is day 1, Saturday is day 7)
- Exactly ${days} training days and ${7 - days} rest/recovery days${specificDays ? '. IMPORTANT: Schedule workouts ONLY on these specific days: ' + specificDays + '. All other days must be rest/recovery.' : ''}
- Style must reflect ${styleLabel} (e.g. Bodybuilding = hypertrophy focus, Powerlifting = SBD focus, etc.)
- Keep workouts under the max duration of ${durationLabel}.

2. Each Workout Must Include Structured Blocks:
- warmup: 2-3 mobility + activation exercises
- main: 2-4 compound strength-focused lifts
- accessory: 2-4 hypertrophy / volume exercises
- finisher: 1 optional conditioning or intensity finisher (can be empty array if not applicable)
- core: 1-2 core exercises (spread across the week, not every day)
- cooldown: 2-3 stretching or recovery exercises

3. Exercise Selection:
- ONLY use this equipment: ${equip}
- STRICTLY avoid exercises that aggravate: ${injuries}
- Compound movements first, isolation later
- EXERCISE NAMING: Use EXACT names from the reference lists below whenever possible.

Available Exercises:
- PRIMARY COMPOUNDS (Use these for the 'main' block):
  ${exerciseNames.compounds.join(", ")}

- ACCESSORY / ISOLATION (Use these for 'accessory', 'warmup', or 'finisher'):
  ${exerciseNames.isolations.join(", ")}

4. Progressive Overload & RPE Logic:
- Include RPE (Rate of Perceived Exertion) or RIR (Reps in Reserve) in the notes for main lifts to guide the user's intensity.
- If previous week exists and user found it easy: increase sets, reps, or load
- If user struggled: reduce volume slightly or simplify movements
- If first week: set a solid baseline

5. Personalization:
- Adapt intensity to sleep (${p.sleepHours || "7"}hrs) and stress (${p.stressLevel || "medium"})
- Adjust volume to fitness level (${p.fitnessLevel || "beginner"})
- Account for job fatigue (${p.jobType || "sedentary"})

---

NUTRITION INSTRUCTIONS
- Goal: ${goalLabel}
- Calorie Target: ${target} kcal/day (TDEE: ${tdee}, adjustment: ${adj >= 0 ? "+" : ""}${adj})
- Diet: ${diet}
- Give 4-5 practical meal examples. Use batch prep realism (e.g. eating the same batch-cooked protein for lunch and dinner, or overnight oats for fast mornings) to make the meal plan sustainable for their stress and job level.`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      weekPlan: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            day: { type: "STRING" },
            dayName: { type: "STRING" },
            dayIndex: { type: "INTEGER" },
            type: { type: "STRING" },
            focus: { type: "STRING" },
            muscleGroups: { type: "STRING" },
            estimatedDuration: { type: "STRING" },
            blocks: {
              type: "OBJECT",
              properties: {
                warmup: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, details: { type: "STRING" } }, required: ["name", "details"] } },
                main: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, sets: { type: "INTEGER" }, reps: { type: "STRING" }, restSeconds: { type: "INTEGER" }, notes: { type: "STRING" } }, required: ["name", "sets", "reps", "restSeconds", "notes"] } },
                accessory: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, sets: { type: "INTEGER" }, reps: { type: "STRING" }, restSeconds: { type: "INTEGER" }, notes: { type: "STRING" } }, required: ["name", "sets", "reps", "restSeconds", "notes"] } },
                finisher: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, duration: { type: "STRING" }, notes: { type: "STRING" } }, required: ["name", "duration", "notes"] } },
                core: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, sets: { type: "INTEGER" }, reps: { type: "STRING" }, notes: { type: "STRING" } }, required: ["name", "sets", "reps", "notes"] } },
                cooldown: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, details: { type: "STRING" } }, required: ["name", "details"] } }
              },
              required: ["warmup", "main", "accessory", "finisher", "core", "cooldown"]
            }
          },
          required: ["day", "dayName", "dayIndex", "type", "focus", "muscleGroups", "estimatedDuration", "blocks"]
        }
      },
      progression: {
        type: "OBJECT",
        properties: {
          strategy: { type: "STRING" },
          nextWeekFocus: { type: "STRING" }
        },
        required: ["strategy", "nextWeekFocus"]
      },
      nutrition: {
        type: "OBJECT",
        properties: {
          dailyCalories: { type: "INTEGER" },
          macros: {
            type: "OBJECT",
            properties: { protein: { type: "INTEGER" }, carbs: { type: "INTEGER" }, fat: { type: "INTEGER" } },
            required: ["protein", "carbs", "fat"]
          },
          mealPlans: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                dayIndex: { type: "INTEGER" },
                dayName: { type: "STRING" },
                type: { type: "STRING" },
                meals: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      meal: { type: "STRING" },
                      name: { type: "STRING" },
                      example: { type: "STRING" },
                      calories: { type: "INTEGER" },
                      protein: { type: "INTEGER" }
                    },
                    required: ["meal", "name", "example", "calories", "protein"]
                  }
                }
              },
              required: ["dayIndex", "dayName", "type", "meals"]
            }
          },
          tips: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["dailyCalories", "macros", "mealPlans", "tips"]
      },
      coachNote: { type: "STRING" }
    },
    required: ["weekPlan", "progression", "nutrition", "coachNote"]
  };

  return { systemInstruction, prompt, responseSchema };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!GEMINI_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set in Vercel environment variables." });

  const profile = req.body;
  const { systemInstruction, prompt, responseSchema }  = buildPayload(profile);

  for (const model of ["gemini-2.5-flash", "gemini-2.5-flash-lite"]) {
    try {
      console.log("Trying:", model);
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { 
              temperature: 0.6, 
              maxOutputTokens: 12000,
              responseMimeType: "application/json",
              responseSchema: responseSchema
            },
          }),
        }
      );
      const data = await r.json();
      if (!r.ok) { console.error(model, r.status, data?.error?.message); continue; }
      const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
      if (!text) { console.error(model, "empty"); continue; }
      
      const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      const plan  = JSON.parse(clean);
      console.log("Success:", model);

      // Fire-and-forget push notification
      const fcmTokens = profile?.fcmTokens || (profile?.fcmToken ? [profile.fcmToken] : []);
      const week      = (profile?.currentWeek || 0) + 1;
      if (fcmTokens.length && profile?.uid) {
        import("../../lib/firebaseAdmin")
          .then(({ sendPushNotification }) => sendPushNotification({
            uid:    profile.uid,
            tokens: fcmTokens,
            title:  "New plan ready 💪",
            body:   `Week ${week} training plan is ready. Let's go.`,
            link:   "/dashboard",
          }))
          .catch(() => {});
      }

      return res.status(200).json(plan);
    } catch (e) {
      console.error(model, e.message);
    }
  }

  return res.status(500).json({ error: "Plan generation failed. Check Vercel runtime logs." });
}
