const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

function buildPrompt(profile) {
  const {
    age, gender, weight, weightUnit, height, heightUnit, bodyFat,
    fitnessLevel, injuries, medicalConditions,
    jobType, sleepHours, stressLevel, trainingDays,
    primaryGoal, targetWeight, workoutLocation, equipment, dietaryPrefs,
  } = profile;

  const injuryStr    = injuries?.length ? injuries.join(", ") : "None";
  const equipStr     = equipment?.length ? equipment.join(", ") : "Bodyweight only";
  const dietStr      = dietaryPrefs?.length ? dietaryPrefs.join(", ") : "No restrictions";
  const locationStr  = workoutLocation?.length ? workoutLocation.join("/") : "Gym";

  return `You are an elite personal trainer and sports nutritionist. Generate a highly personalized 7-day workout and nutrition plan based on this user's profile. Return ONLY valid JSON, no markdown, no explanation.

USER PROFILE:
- Age: ${age || "Unknown"}, Gender: ${gender || "Unknown"}
- Weight: ${weight} ${weightUnit}, Height: ${height} ${heightUnit}
- Body Fat: ${bodyFat || "Unknown"}
- Fitness Level: ${fitnessLevel || "beginner"}
- Injuries/Limitations: ${injuryStr}
- Medical Conditions: ${medicalConditions || "None"}
- Job Type: ${jobType || "sedentary"}
- Average Sleep: ${sleepHours || "7-8h"}
- Stress Level: ${stressLevel || "Medium"}
- Training Days/Week: ${trainingDays || 4}
- Primary Goal: ${primaryGoal || "maintain"}
- Target Weight: ${targetWeight || "Not specified"}
- Workout Location: ${locationStr}
- Available Equipment: ${equipStr}
- Dietary Preferences: ${dietStr}

IMPORTANT RULES:
- Schedule exactly ${trainingDays || 4} workout days and the rest as rest/recovery days
- All exercises must be appropriate for ${locationStr} with ${equipStr}
- Avoid exercises that stress these areas: ${injuryStr}
- Goal is ${primaryGoal} — adjust volume, intensity, and calories accordingly
- Respect dietary preferences: ${dietStr}
- Calories should reflect their goal (deficit for fat loss, surplus for muscle gain, maintenance for maintain)
- Make the plan TRULY different from a generic plan — use the profile to make specific choices

Return this exact JSON structure:
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
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Keep elbows at 45 degrees"
        }
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
    "macros": {
      "protein": 180,
      "carbs": 240,
      "fat": 80
    },
    "meals": {
      "breakfast": {
        "name": "High-Protein Oats Bowl",
        "calories": 520,
        "protein": 38,
        "carbs": 60,
        "fat": 12,
        "ingredients": ["80g oats", "1 scoop whey protein", "1 banana", "30g peanut butter", "200ml milk"],
        "instructions": "Cook oats with milk, stir in protein powder off heat, top with banana and peanut butter."
      },
      "lunch": {
        "name": "Grilled Chicken Rice Bowl",
        "calories": 680,
        "protein": 52,
        "carbs": 75,
        "fat": 14,
        "ingredients": ["200g chicken breast", "150g white rice", "100g broccoli", "1 tbsp olive oil", "soy sauce"],
        "instructions": "Grill seasoned chicken, steam broccoli, serve over rice with olive oil and soy sauce."
      },
      "dinner": {
        "name": "Salmon with Sweet Potato",
        "calories": 720,
        "protein": 48,
        "carbs": 65,
        "fat": 24,
        "ingredients": ["200g salmon fillet", "250g sweet potato", "mixed salad", "lemon", "olive oil"],
        "instructions": "Bake salmon at 200°C for 18 mins. Roast diced sweet potato for 25 mins. Serve with salad."
      },
      "snacks": [
        {
          "name": "Greek Yogurt & Berries",
          "calories": 220,
          "protein": 18,
          "carbs": 24,
          "fat": 4,
          "ingredients": ["200g Greek yogurt", "100g mixed berries", "1 tbsp honey"],
          "instructions": "Mix together and eat cold."
        },
        {
          "name": "Almonds & Apple",
          "calories": 260,
          "protein": 7,
          "carbs": 28,
          "fat": 14,
          "ingredients": ["30g almonds", "1 medium apple"],
          "instructions": "Eat together as a snack."
        }
      ]
    },
    "nutritionNotes": "Adjust portion sizes based on hunger. Prioritize protein at every meal."
  },
  "coachNote": "Based on your profile, I've prioritized compound movements for muscle gain while accounting for your lower back limitation."
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const profile = req.body;

  if (!GEMINI_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(profile) }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini error:", err);
      return res.status(500).json({ error: "Gemini API error", details: err });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) return res.status(500).json({ error: "Empty Gemini response" });

    const plan = JSON.parse(text);
    return res.status(200).json(plan);

  } catch (e) {
    console.error("Plan generation error:", e);
    return res.status(500).json({ error: e.message });
  }
}
