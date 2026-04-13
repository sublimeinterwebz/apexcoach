export const config = { maxDuration: 60 };

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

function buildPrompt(p) {
  const days     = parseInt(p.trainingDays) || 4;
  const injuries = (p.injuries || []).filter(x => x && x !== "None").join(", ") || "none";
  const equip    = (p.equipment || []).join(", ") || "bodyweight";
  const diet     = (p.dietaryPrefs || []).filter(x => x && x !== "No Restrictions").join(", ") || "none";
  const loc      = (p.workoutLocation || []).join("/") || "gym";
  const goal     = { fat_loss:"fat loss (300kcal deficit)", muscle_gain:"muscle gain (300kcal surplus)", maintain:"maintenance" }[p.primaryGoal] || "maintenance";

  return `You are a fitness coach. Return ONLY valid JSON, no markdown.

User: ${p.age}yr ${p.gender}, ${p.weight}${p.weightUnit || "kg"}, ${p.height}${p.heightUnit || "cm"}, ${p.fitnessLevel || "beginner"}, goal: ${goal}, ${days} training days/week, location: ${loc}, equipment: ${equip}, injuries: ${injuries}, diet: ${diet}, sleep: ${p.sleepHours || "7h"}, stress: ${p.stressLevel || "medium"}, job: ${p.jobType || "sedentary"}.

Generate exactly 7 days (${days} workouts, ${7 - days} rest). Only use: ${equip}. Avoid exercises stressing: ${injuries}. Personalize meals for diet: ${diet}.

JSON:
{"weekPlan":[{"dayIndex":0,"dayName":"Monday","type":"workout","sessionLabel":"Push Day","muscleGroups":"Chest, Shoulders, Triceps","estimatedDuration":"45 min","exercises":[{"name":"Push-up","sets":4,"reps":"12","restSeconds":60,"notes":""}]},{"dayIndex":1,"dayName":"Tuesday","type":"rest","sessionLabel":"Rest","muscleGroups":"","estimatedDuration":"","exercises":[]}],"nutrition":{"dailyCalories":2200,"macros":{"protein":160,"carbs":220,"fat":70},"meals":{"breakfast":{"name":"Protein Oats","calories":450,"protein":32,"carbs":50,"fat":10,"ingredients":["80g oats","1 scoop whey","1 banana","200ml milk"],"instructions":"Cook oats, mix protein in, top with banana."},"lunch":{"name":"Chicken Rice Bowl","calories":600,"protein":48,"carbs":65,"fat":12,"ingredients":["180g chicken","150g rice","broccoli","olive oil"],"instructions":"Grill chicken, serve over rice with veg."},"dinner":{"name":"Salmon Sweet Potato","calories":640,"protein":42,"carbs":58,"fat":19,"ingredients":["180g salmon","200g sweet potato","salad","lemon"],"instructions":"Bake salmon 200C 18min, roast potato 25min."},"snacks":[{"name":"Greek Yogurt Berries","calories":180,"protein":15,"carbs":18,"fat":3,"ingredients":["200g Greek yogurt","100g berries","honey"],"instructions":"Mix and serve."}]},"nutritionNotes":"Personalized note here."},"coachNote":"One personal coaching note for this user."}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  if (!GEMINI_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set in Vercel environment variables." });
  }

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
            generationConfig: { temperature: 0.8, maxOutputTokens: 2500 },
          }),
        }
      );

      const data = await r.json();
      if (!r.ok) {
        console.error(model, r.status, data?.error?.message);
        continue;
      }

      const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
      if (!text) { console.error(model, "empty"); continue; }

      const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      const plan = JSON.parse(clean);
      console.log("Success:", model);
      return res.status(200).json(plan);

    } catch (e) {
      console.error(model, e.message);
    }
  }

  return res.status(500).json({ error: "Plan generation failed. Check Vercel runtime logs." });
}
