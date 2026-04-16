export const config = { maxDuration: 60 };

import exercisesData from "../../data/exercises.json";
import equipmentMap  from "../../data/equipment_map.json";

function getExerciseNames(userEquipmentLabels) {
  const PRIORITY = ["barbell","dumbbell","cable","leverage machine","smith machine",
                    "kettlebell","band","resistance band","ez barbell","body weight"];
  const allowed = new Set(["body weight"]);
  (userEquipmentLabels || []).forEach(label => {
    (equipmentMap[label] || []).forEach(eq => allowed.add(eq));
  });
  const groups = {};
  for (const ex of exercisesData) {
    if (!allowed.has(ex.equipment) || !ex.name) continue;
    const key = `${ex.equipment}|${ex.bodyPart}`;
    if (!groups[key]) groups[key] = [];
    if (groups[key].length < 5) groups[key].push(ex.name);
  }
  const names = new Set();
  for (const equip of PRIORITY) {
    for (const [key, list] of Object.entries(groups)) {
      if (key.startsWith(equip + "|")) list.forEach(n => names.add(n));
    }
  }
  return [...names];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { plan, request, profile } = req.body;
  if (!plan || !request) return res.status(400).json({ error: "Missing plan or request" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing API key" });

  const days    = parseInt(profile?.trainingDays) || 4;
  const injuries = (profile?.injuries || []).filter(x => x && x !== "None").join(", ") || "none";
  const equip    = profile?.equipmentStr || (profile?.equipment || []).join(", ") || "standard gym equipment";
  const diet     = (profile?.dietaryPrefs || []).filter(x => x && x !== "No Restrictions").join(", ") || "no restrictions";
  const loc      = (profile?.workoutLocation || []).join("/") || "gym";
  const goal     = { fat_loss:"fat loss", muscle_gain:"muscle gain", maintain:"maintenance" }[profile?.primaryGoal] || "general fitness";
  const specificDays = (profile?.trainingDaysOfWeek || []).join(", ") || null;

  const prompt = `You are an elite fitness coach. A client has reviewed their training plan and made a specific adjustment request. Regenerate their COMPLETE weekly plan incorporating that request.

Client Profile:
- Age: ${profile?.age}yr, Gender: ${profile?.gender}, Weight: ${profile?.weight}${profile?.weightUnit || "kg"}
- Fitness Level: ${profile?.fitnessLevel || "intermediate"}
- Goal: ${goal}
- Training Days: ${days} days/week${specificDays ? " on " + specificDays : ""}
- Location: ${loc}
- Equipment: ${equip}
- Injuries: ${injuries}
- Diet: ${diet}

Their CURRENT PLAN:
${JSON.stringify(plan, null, 2)}

The client's requested adjustment: "${request}"

Available exercise names for this client's equipment (use EXACT names from this list):
${getExerciseNames([...(profile?.gymEquipment||[]), ...(profile?.homeEquipment||[])]).join(", ")}

TASK: Regenerate the COMPLETE plan from scratch, fully incorporating this adjustment. Keep everything else consistent with the client's profile. The adjustment request should be clearly reflected in the new plan.

Return ONLY raw JSON with EXACTLY this structure (no markdown, no extra text):
{
  "weekPlan": [
    {
      "day": "Day 1",
      "dayName": "MON",
      "dayIndex": 0,
      "type": "strength",
      "focus": "Session Name",
      "muscleGroups": "e.g. Chest, Triceps",
      "estimatedDuration": "60 MIN",
      "blocks": {
        "warmup": [{"name": "", "details": "", "duration": ""}],
        "main": [{"name": "", "sets": 4, "reps": "6-8", "restSeconds": 120, "notes": ""}],
        "accessory": [{"name": "", "sets": 3, "reps": "10-12", "restSeconds": 60, "notes": ""}],
        "finisher": [],
        "core": [{"name": "", "sets": 3, "reps": "12-15", "restSeconds": 45, "notes": ""}],
        "cooldown": [{"name": "", "details": "", "duration": ""}]
      }
    }
  ],
  "progression": {"strategy": "", "nextWeekFocus": ""},
  "nutrition": {
    "dailyCalories": 2400,
    "macros": {"protein": 180, "carbs": 240, "fat": 80},
    "mealExamples": [{"meal": "Breakfast", "example": "", "calories": 500, "protein": 40}],
    "tips": [""]
  },
  "coachNote": ""
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 6000, temperature: 0.4 },
        }),
      }
    );

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const updated = JSON.parse(clean);
    return res.status(200).json(updated);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
