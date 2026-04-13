// Server-side: read both variants of the env var
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

function buildPrompt(profile) {
  const {
    age, gender, weight, weightUnit, height, heightUnit, bodyFat,
    fitnessLevel, injuries, medicalConditions,
    jobType, sleepHours, stressLevel, trainingDays,
    primaryGoal, targetWeight, workoutLocation, equipment, dietaryPrefs,
  } = profile;

  const injuryStr   = (injuries?.filter(x => x !== "None") || []).join(", ") || "None";
  const equipStr    = equipment?.length ? equipment.join(", ") : "Bodyweight only";
  const dietStr     = dietaryPrefs?.filter(x => x !== "No Restrictions").join(", ") || "No restrictions";
  const locationStr = workoutLocation?.length ? workoutLocation.join(" or ") : "Gym";
  const goalLabel   = { fat_loss:"fat loss", muscle_gain:"muscle gain", maintain:"maintain and tone" }[primaryGoal] || primaryGoal || "general fitness";

  return `You are an elite personal trainer and sports nutritionist. Generate a highly personalized weekly plan. RETURN ONLY VALID JSON — no markdown, no backticks, no explanation.

USER PROFILE:
- Age: ${age || "Unknown"}, Gender: ${gender || "Unknown"}
- Weight: ${weight} ${weightUnit}, Height: ${height} ${heightUnit}, Body Fat: ${bodyFat || "Unknown"}
- Fitness Level: ${fitnessLevel || "beginner"}
- Injuries/Limitations: ${injuryStr}
- Medical Conditions: ${medicalConditions || "None"}
- Job: ${jobType || "sedentary"}, Sleep: ${sleepHours || "7h"}, Stress: ${stressLevel || "Medium"}
- Training Days/Week: ${trainingDays || 4}
- Goal: ${goalLabel}${targetWeight ? `, Target Weight: ${targetWeight}` : ""}
- Location: ${locationStr}, Equipment: ${equipStr}
- Diet: ${dietStr}

RULES:
- Schedule EXACTLY ${trainingDays || 4} workout days out of 7, rest on others
- Only use exercises suitable for ${locationStr} with: ${equipStr}
- Avoid exercises that strain: ${injuryStr}
- Calories: ${primaryGoal === "fat_loss" ? "200-400 calorie deficit" : primaryGoal === "muscle_gain" ? "200-400 calorie surplus" : "maintenance calories"}
- Make exercises and meals SPECIFIC to this person — not generic

JSON FORMAT (return exactly this structure, fill all 7 days):
{
  "weekPlan": [
    {
      "dayIndex": 0,
      "dayName": "Monday",
      "type": "workout",
      "sessionLabel": "Push Day",
      "muscleGroups": "Chest, Shoulders, Triceps",
      "estimatedDuration": "55 min",
      "exercises": [
        { "name": "Barbell Bench Press", "sets": 4, "reps": "8-10", "restSeconds": 90, "notes": "Control the descent" }
      ]
    },
    {
      "dayIndex": 1,
      "dayName": "Tuesday",
      "type": "rest",
      "sessionLabel": "Rest & Recovery",
      "muscleGroups": "",
      "estimatedDuration": "",
      "exercises": []
    }
  ],
  "nutrition": {
    "dailyCalories": 2400,
    "macros": { "protein": 180, "carbs": 240, "fat": 80 },
    "meals": {
      "breakfast": {
        "name": "High-Protein Oats",
        "calories": 520,
        "protein": 38,
        "carbs": 60,
        "fat": 12,
        "ingredients": ["80g oats", "1 scoop whey protein", "1 banana", "200ml milk"],
        "instructions": "Cook oats with milk, stir in protein off heat, top with banana."
      },
      "lunch": {
        "name": "Grilled Chicken Rice Bowl",
        "calories": 680,
        "protein": 52,
        "carbs": 75,
        "fat": 14,
        "ingredients": ["200g chicken breast", "150g white rice", "100g broccoli", "soy sauce"],
        "instructions": "Grill chicken, steam broccoli, serve over rice."
      },
      "dinner": {
        "name": "Salmon with Sweet Potato",
        "calories": 720,
        "protein": 48,
        "carbs": 65,
        "fat": 24,
        "ingredients": ["200g salmon", "250g sweet potato", "mixed salad", "olive oil"],
        "instructions": "Bake salmon 200C for 18 mins. Roast diced sweet potato 25 mins."
      },
      "snacks": [
        {
          "name": "Greek Yogurt & Berries",
          "calories": 220,
          "protein": 18,
          "carbs": 24,
          "fat": 4,
          "ingredients": ["200g Greek yogurt", "100g berries", "1 tbsp honey"],
          "instructions": "Mix and serve cold."
        }
      ]
    },
    "nutritionNotes": "Personalized note based on their goal and diet preferences."
  },
  "coachNote": "One sentence personal note about their plan based on their specific profile."
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  if (!GEMINI_KEY) {
    console.error("No Gemini API key found. Set GEMINI_API_KEY in Vercel env vars.");
    return res.status(500).json({ error: "Gemini API key not configured. Add GEMINI_API_KEY to Vercel environment variables." });
  }

  const profile = req.body;

  const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: buildPrompt(profile) }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(`Gemini ${model} error:`, JSON.stringify(data));
        continue; // try next model
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) { console.error("Empty text from", model); continue; }

      // Strip markdown code fences if present
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

      try {
        const plan = JSON.parse(cleaned);
        console.log(`Plan generated successfully with ${model}`);
        return res.status(200).json(plan);
      } catch (parseErr) {
        console.error(`JSON parse error with ${model}:`, parseErr.message, "\nRaw:", cleaned.slice(0, 200));
        continue;
      }
    } catch (fetchErr) {
      console.error(`Fetch error with ${model}:`, fetchErr.message);
      continue;
    }
  }

  return res.status(500).json({ error: "All Gemini models failed. Check server logs." });
}
