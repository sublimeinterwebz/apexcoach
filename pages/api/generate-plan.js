export const config = { maxDuration: 60 };

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

function buildPrompt(p) {
  const days          = parseInt(p.trainingDays) || 4;
  const injuries      = (p.injuries || []).filter(x => x && x !== "None").join(", ") || "none";
  const equip         = p.equipmentStr || (p.equipment || []).join(", ") || "standard gym equipment";
  const diet          = (p.dietaryPrefs || []).filter(x => x && x !== "No Restrictions").join(", ") || "no restrictions";
  const loc           = (p.workoutLocation || []).join("/") || "gym";
  const specificDays  = (p.trainingDaysOfWeek || []).join(", ") || null;
  const goal      = { fat_loss:"fat loss (300kcal deficit)", muscle_gain:"muscle gain (300kcal surplus)", maintain:"maintenance" }[p.primaryGoal] || "maintenance";

  // Previous week context
  const lastWeekPlan     = p.lastWeekPlan     || "None (this is the first week)";
  const lastWeekFeedback = p.lastWeekFeedback
    ? `Difficulty: ${p.lastWeekFeedback.difficulty}, Energy: ${p.lastWeekFeedback.energy}, Completed workouts: ${p.lastWeekFeedback.completedWorkouts} of ${days}`
    : "None (this is the first week)";

  return `You are an elite fitness coach designing a personalized weekly training and nutrition plan.

User Profile:
- Age: ${p.age}yr, Gender: ${p.gender}, Weight: ${p.weight}${p.weightUnit || "kg"}, Height: ${p.height}${p.heightUnit || "cm"}
- Fitness Level: ${p.fitnessLevel || "beginner"}
- Goal: ${goal}
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
- Last Week Feedback: ${lastWeekFeedback}

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

- Goal: ${goal}
- Diet: ${diet}
- Provide daily calorie estimate and macro breakdown
- Give 4-5 practical, non-generic meal examples (breakfast, lunch, dinner, snack, pre/post workout)
- Keep it flexible and sustainable

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
    "macros": {
      "protein": 180,
      "carbs": 240,
      "fat": 80
    },
    "mealExamples": [
      {"meal": "Breakfast", "example": "3 scrambled eggs, 80g oats with berries, black coffee", "calories": 520, "protein": 38},
      {"meal": "Lunch", "example": "200g grilled chicken breast, 150g white rice, cucumber salad", "calories": 650, "protein": 52},
      {"meal": "Pre-Workout", "example": "1 banana, 20g whey protein in water", "calories": 200, "protein": 20},
      {"meal": "Dinner", "example": "180g salmon, 200g sweet potato, steamed broccoli", "calories": 680, "protein": 45},
      {"meal": "Snack", "example": "200g Greek yogurt, 30g mixed nuts", "calories": 300, "protein": 18}
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
            generationConfig: { temperature: 0.8, maxOutputTokens: 6000 },
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
      return res.status(200).json(plan);
    } catch (e) {
      console.error(model, e.message);
    }
  }

  return res.status(500).json({ error: "Plan generation failed. Check Vercel runtime logs." });
}
