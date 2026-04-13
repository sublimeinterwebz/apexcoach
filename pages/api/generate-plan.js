// Increase timeout — works on Pro plan; on Hobby we'll optimize the prompt to be fast
export const config = { maxDuration: 60 };

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

function buildPrompt(profile) {
  const {
    age, gender, weight, weightUnit, height, heightUnit,
    fitnessLevel, injuries, jobType, sleepHours, stressLevel,
    trainingDays, primaryGoal, workoutLocation, equipment, dietaryPrefs,
  } = profile;

  const days = parseInt(trainingDays) || 4;
  const injuryNote = (injuries?.filter(x => x && x !== "None") || []).join(", ") || "none";
  const equipNote  = equipment?.length ? equipment.slice(0, 4).join(", ") : "bodyweight";
  const dietNote   = dietaryPrefs?.filter(x => x && x !== "No Restrictions").join(", ") || "none";
  const goalLabel  = { fat_loss:"fat loss (caloric deficit)", muscle_gain:"muscle gain (caloric surplus)", maintain:"maintenance" }[primaryGoal] || "maintenance";
  const locationStr = workoutLocation?.join("/") || "gym";

  // Compact prompt — fast response, still personalized
  return `Create a personalized fitness plan. Return ONLY valid JSON, no markdown.

Profile: ${age}yo ${gender}, ${weight}${weightUnit}, ${height}${heightUnit}, ${fitnessLevel} level, goal: ${goalLabel}, ${days} training days/week, ${locationStr} with ${equipNote}, injuries: ${injuryNote}, diet: ${dietNote}, sleep: ${sleepHours || "7h"}, stress: ${stressLevel || "medium"}, job: ${jobType || "sedentary"}

Return this JSON (7 days total, exactly ${days} workout days, rest on others):
{"weekPlan":[{"dayIndex":0,"dayName":"Monday","type":"workout","sessionLabel":"Push Day","muscleGroups":"Chest, Shoulders, Triceps","estimatedDuration":"50 min","exercises":[{"name":"Bench Press","sets":4,"reps":"8-10","restSeconds":90,"notes":""}]},{"dayIndex":1,"dayName":"Tuesday","type":"rest","sessionLabel":"Rest","muscleGroups":"","estimatedDuration":"","exercises":[]}],"nutrition":{"dailyCalories":2200,"macros":{"protein":165,"carbs":220,"fat":73},"meals":{"breakfast":{"name":"Protein Oats","calories":480,"protein":35,"carbs":55,"fat":10,"ingredients":["80g oats","1 scoop whey","1 banana","200ml milk"],"instructions":"Cook oats, stir in protein, top with banana."},"lunch":{"name":"Chicken Rice Bowl","calories":650,"protein":50,"carbs":70,"fat":12,"ingredients":["180g chicken","150g rice","broccoli","olive oil"],"instructions":"Grill chicken, steam veg, serve over rice."},"dinner":{"name":"Salmon & Sweet Potato","calories":680,"protein":45,"carbs":60,"fat":22,"ingredients":["180g salmon","200g sweet potato","salad","lemon"],"instructions":"Bake salmon 200C 18min, roast potato 25min."},"snacks":[{"name":"Greek Yogurt","calories":200,"protein":17,"carbs":20,"fat":3,"ingredients":["200g Greek yogurt","berries","honey"],"instructions":"Mix and serve."}]},"nutritionNotes":"Personalized note here."},"coachNote":"One specific note about this person's plan."}

Rules: only use ${equipNote} exercises, avoid strain on ${injuryNote}, set calories for ${goalLabel}, personalize meals for diet: ${dietNote}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  if (!GEMINI_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set in Vercel environment variables." });
  }

  const profile = req.body;
  // Use fastest model first
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b"];

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: buildPrompt(profile) }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3000,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(`${model} API error ${response.status}:`, JSON.stringify(data).slice(0, 300));
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error(`${model} empty response. Finish reason:`, data?.candidates?.[0]?.finishReason);
        continue;
      }

      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

      try {
        const plan = JSON.parse(cleaned);
        console.log(`Success with ${model}`);
        return res.status(200).json(plan);
      } catch (e) {
        console.error(`${model} JSON parse failed:`, e.message, "| First 200 chars:", cleaned.slice(0, 200));
        continue;
      }
    } catch (e) {
      console.error(`${model} fetch error:`, e.message);
      continue;
    }
  }

  return res.status(500).json({ error: "Plan generation failed. Your Gemini API key may be invalid or rate-limited. Check Vercel logs for details." });
}
