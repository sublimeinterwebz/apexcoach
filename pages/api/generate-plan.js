export const config = { maxDuration: 60 };

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

function buildPrompt(p) {
  const days     = parseInt(p.trainingDays) || 4;
  const injuries = (p.injuries || []).filter(x => x && x !== "None").join(", ") || "none";
  const equip    = (p.equipment || []).slice(0, 5).join(", ") || "bodyweight";
  const diet     = (p.dietaryPrefs || []).filter(x => x && x !== "No Restrictions").join(", ") || "none";
  const loc      = (p.workoutLocation || []).join("/") || "gym";
  const goal     = { fat_loss: "fat loss", muscle_gain: "muscle gain", maintain: "maintain" }[p.primaryGoal] || "maintain";
  const cal      = p.primaryGoal === "fat_loss" ? "deficit 300kcal" : p.primaryGoal === "muscle_gain" ? "surplus 300kcal" : "maintenance";

  return `You are a fitness coach. Return ONLY a JSON object (no markdown, no explanation).

User: ${p.age}yr ${p.gender}, ${p.weight}${p.weightUnit}, ${p.height}${p.heightUnit}, ${p.fitnessLevel || "beginner"}, goal: ${goal}, ${days} training days/week, location: ${loc}, equipment: ${equip}, injuries: ${injuries}, diet: ${diet}, sleep: ${p.sleepHours || "7h"}, stress: ${p.stressLevel || "medium"}, job: ${p.jobType || "sedentary"}.

Generate 7 days (${days} workout + ${7 - days} rest). Only use ${equip}. Avoid exercises stressing: ${injuries}. Calories: ${cal}. Respect diet: ${diet}.

JSON structure:
{
  "weekPlan": [
    {"dayIndex":0,"dayName":"Monday","type":"workout","sessionLabel":"Push","muscleGroups":"Chest, Shoulders","estimatedDuration":"45 min","exercises":[{"name":"Push-up","sets":3,"reps":"12","restSeconds":60,"notes":""}]},
    {"dayIndex":1,"dayName":"Tuesday","type":"rest","sessionLabel":"Rest","muscleGroups":"","estimatedDuration":"","exercises":[]}
  ],
  "nutrition": {
    "dailyCalories": 2200,
    "macros": {"protein":160,"carbs":220,"fat":70},
    "meals": {
      "breakfast": {"name":"Protein Oats","calories":450,"protein":32,"carbs":50,"fat":10,"ingredients":["80g oats","whey protein","banana","milk"],"instructions":"Cook oats, mix protein in, add banana."},
      "lunch": {"name":"Chicken & Rice","calories":600,"protein":48,"carbs":65,"fat":12,"ingredients":["chicken breast","rice","vegetables"],"instructions":"Grill chicken, serve with rice and veg."},
      "dinner": {"name":"Salmon & Potatoes","calories":650,"protein":42,"carbs":58,"fat":20,"ingredients":["salmon","sweet potato","salad"],"instructions":"Bake salmon 18min, roast potato 25min."},
      "snacks": [{"name":"Greek Yogurt","calories":180,"protein":15,"carbs":18,"fat":3,"ingredients":["Greek yogurt","berries"],"instructions":"Serve cold."}]
    },
    "nutritionNotes": "Adjust portions to hunger."
  },
  "coachNote": "Brief note for this specific user."
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const key = GEMINI_KEY;
  console.log("Key present:", !!key, "Key prefix:", key ? key.slice(0, 8) : "MISSING");

  if (!key) {
    return res.status(500).json({
      error: "GEMINI_API_KEY missing from environment. Please redeploy after adding it in Vercel settings."
    });
  }

  const profile = req.body;
  const prompt  = buildPrompt(profile);

  // Try models in order of speed
  for (const model of ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash"]) {
    console.log("Trying:", model);
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 2500,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const data = await r.json();
      if (!r.ok) {
        console.error(model, "HTTP", r.status, JSON.stringify(data).slice(0, 400));
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

      if (!clean) {
        console.error(model, "empty text, finishReason:", data?.candidates?.[0]?.finishReason);
        continue;
      }

      const plan = JSON.parse(clean);
      console.log("Success:", model);
      return res.status(200).json(plan);

    } catch (e) {
      console.error(model, "error:", e.message);
    }
  }

  return res.status(500).json({ error: "All models failed. Check Vercel runtime logs." });
}
