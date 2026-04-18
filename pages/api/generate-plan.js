export const config = { maxDuration: 60 };

const exercisesData = require("../../data/exercises.json");
const equipmentMap  = require("../../data/equipment_map.json");

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
  return [...names];
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

  // Activity multiplier — combines job type + training frequency
  const job = p.jobType || "sedentary";
  let multiplier;
  if      (job === "active")    multiplier = days >= 5 ? 1.9  : 1.725;
  else if (job === "light")     multiplier = days >= 4 ? 1.55 : 1.375;
  else /* sedentary */          multiplier = days >= 5 ? 1.55 : days >= 3 ? 1.375 : 1.2;

  const tdee = Math.round(bmr * multiplier);

  // Goal-based adjustment
  const adj = { fat_loss: -400, muscle_gain: 300, maintain: 0 }[p.primaryGoal] || 0;
  return { tdee, target: tdee + adj, adj };
}

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

function buildPrompt(p) {
  const days          = parseInt(p.trainingDays) || 4;
  const injuries      = (p.injuries || []).filter(x => x && x !== "None").join(", ") || "none";
  const equip         = p.equipmentStr || (p.equipment || []).join(", ") || "standard gym equipment";
  const diet          = (p.dietaryPrefs || []).filter(x => x && x !== "No Restrictions").join(", ") || "no restrictions";
  const loc           = (p.workoutLocation || []).join("/") || "gym";
  const specificDays     = (p.trainingDaysOfWeek || []).join(", ") || null;
  // Build equipment labels list for exercise name filtering
  const equipLabels      = [
    ...(p.gymEquipment  || []),
    ...(p.homeEquipment || []),
    ...(p.workoutLocation?.includes("Gym") || p.workoutLocation?.includes("Both") ? ["Full Commercial Gym"] : []),
  ];
  const exerciseNameList = getExerciseNames(equipLabels.length ? equipLabels : ["Full Commercial Gym"]);
  const { tdee, target, adj } = calculateTDEE(p);
  const goalLabel = { fat_loss:"fat loss", muscle_gain:"muscle gain", maintain:"maintenance" }[p.primaryGoal] || "maintenance";
  const goal = `${goalLabel} — calculated TDEE: ${tdee} kcal/day, target: ${target} kcal/day (${adj >= 0 ? "+" : ""}${adj} kcal ${adj < 0 ? "deficit" : adj > 0 ? "surplus" : "maintenance"})`;

  // Previous week context
  const lastWeekPlan     = p.lastWeekPlan     || "None (this is the first week)";
  const lastWeekFeedback = p.lastWeekFeedback
    ? `Difficulty: ${p.lastWeekFeedback.difficulty}, Energy: ${p.lastWeekFeedback.energy}, Completed workouts: ${p.lastWeekFeedback.completedWorkouts} of ${days}`
    : "None (this is the first week)";

  // Previous week user edits — the user modified exercises last week
  // Format as human-readable list so Gemini can honor their preferences
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

  return `You are an elite fitness coach designing a personalized weekly training and nutrition plan.

User Profile:
- Age: ${p.age}yr, Gender: ${p.gender}, Weight: ${p.weight}${p.weightUnit || "kg"}, Height: ${p.height}${p.heightUnit || "cm"}
- Fitness Level: ${p.fitnessLevel || "beginner"}
- Goal: ${goalLabel}
- Calorie Target: ${target} kcal/day (TDEE: ${tdee}, adjustment: ${adj >= 0 ? "+" : ""}${adj})
- Training Days: ${days} days/week${specificDays ? ' on ' + specificDays : ''}
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
- Exactly 7 days total
- Exactly ${days} training days and ${7 - days} rest/recovery days${specificDays ? '. IMPORTANT: Schedule workouts ONLY on these specific days: ' + specificDays + '. All other days must be rest/recovery.' : ''}
- Mix training styles if relevant (strength, hypertrophy, conditioning, mobility)
- Place rest days strategically based on the training split

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
- Vary exercises across the week (avoid repeating the same exercise in consecutive sessions)
- Compound movements first, isolation later
- EXERCISE NAMING: Use EXACT names from the reference list below whenever possible. Only invent a name if no suitable match exists. This ensures exercise demonstrations work correctly.

Available exercise names for this user's equipment:
${exerciseNameList.join(", ")}

4. Progressive Overload Logic:
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
- Provide daily calorie estimate and macro breakdown
- Give 4-5 practical, non-generic meal examples (breakfast, lunch, dinner, snack, pre/post workout)
- Keep it flexible and sustainable

---

COACHING PHILOSOPHY — Apply these principles to every decision:
- Think like a real coach, not a template generator. Every exercise, set, and rep range must fit this specific person.
- Prioritize sustainability over perfection. A plan the user can stick to beats an optimal plan they abandon.
- Avoid extreme or unrealistic programming. No 2-hour sessions for beginners, no 6-day programs for someone with 3 available days.
- Every decision must have a reason. Volume, exercise choice, and progression should be deliberate and coherent — not random.

---

OUTPUT FORMAT — Return ONLY valid JSON. No text outside the JSON object.

{
  "weekPlan": [
    {
      "day": "Day 1",
      "dayName": "Monday",
      "dayIndex": 0,
      "type": "strength",
      "focus": "Upper Body Push",
      "muscleGroups": "Chest, Shoulders, Triceps",
      "estimatedDuration": "60 min",
      "blocks": {
        "warmup": [
          {"name": "Band Pull-Aparts", "details": "2x15, activate rear delts"}
        ],
        "main": [
          {"name": "Barbell Bench Press", "sets": 4, "reps": "5", "restSeconds": 120, "notes": "Heavy — RPE 8"}
        ],
        "accessory": [
          {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10-12", "restSeconds": 75, "notes": ""}
        ],
        "finisher": [
          {"name": "Push-up Burnout", "duration": "Max reps in 60s", "notes": ""}
        ],
        "core": [
          {"name": "Plank", "sets": 3, "reps": "30s hold", "notes": ""}
        ],
        "cooldown": [
          {"name": "Chest Doorway Stretch", "details": "30s each side"}
        ]
      }
    },
    {
      "day": "Day 2",
      "dayName": "Tuesday",
      "dayIndex": 1,
      "type": "rest",
      "focus": "Rest & Recovery",
      "muscleGroups": "",
      "estimatedDuration": "",
      "blocks": {
        "warmup": [], "main": [], "accessory": [], "finisher": [], "core": [], "cooldown": []
      }
    }
  ],
  "progression": {
    "strategy": "Brief explanation of how this week was designed relative to last week",
    "nextWeekFocus": "What should change or progress next week"
  },
  "nutrition": {
    "dailyCalories": 2400,
    "macros": { "protein": 180, "carbs": 240, "fat": 80 },
    "mealPlans": [
      {"dayIndex": 0, "dayName": "Monday", "type": "training", "meals": [
        {"meal": "Breakfast", "name": "Scrambled Eggs & Oats", "example": "3 scrambled eggs, 80g oats, banana", "calories": 520, "protein": 38},
        {"meal": "Lunch", "name": "Chicken Rice Bowl", "example": "200g chicken, 150g rice, salad", "calories": 650, "protein": 52},
        {"meal": "Pre-Workout", "name": "Protein Shake", "example": "25g whey, banana", "calories": 200, "protein": 22},
        {"meal": "Dinner", "name": "Salmon & Sweet Potato", "example": "180g salmon, 200g sweet potato", "calories": 680, "protein": 45},
        {"meal": "Snack", "name": "Greek Yogurt", "example": "200g Greek yogurt, nuts", "calories": 300, "protein": 18}
      ]},
      {"dayIndex": 1, "dayName": "Tuesday", "type": "rest", "meals": [...]},
      ... (7 days total, ALL different meals)
    ],
    "tips": [
      "Drink 2.5–3L of water daily",
      "Eat your largest carb meal around your workout",
      "Prioritize protein at every meal to hit your daily target"
    ]
  },
  "coachNote": "One direct, personal coaching note for this specific user based on their profile and goals"
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!GEMINI_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set in Vercel environment variables." });

  const profile = req.body;
  const prompt  = buildPrompt(profile);

  for (const model of ["gemini-2.5-flash", "gemini-2.5-flash-lite"]) {
    try {
      console.log("Trying:", model);
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: 12000 },
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

      // Fire-and-forget push notification — non-blocking, never fails the response
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
