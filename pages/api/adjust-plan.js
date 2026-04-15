export const config = { maxDuration: 45 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { plan, request, profile } = req.body;
  if (!plan || !request) return res.status(400).json({ error: "Missing plan or request" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing API key" });

  const prompt = `You are an elite personal trainer reviewing a client's training plan.

The client has this profile:
- Goal: ${profile?.primaryGoal || "general fitness"}
- Fitness level: ${profile?.fitnessLevel || "intermediate"}
- Training days: ${profile?.trainingDays || 4} days/week
- Location: ${(profile?.workoutLocation || []).join(", ") || "gym"}
- Equipment: ${(profile?.equipment || []).join(", ") || "full gym"}
- Injuries: ${(profile?.injuries || []).filter(x=>x!=="None").join(", ") || "none"}

Their CURRENT PLAN (JSON):
${JSON.stringify(plan, null, 2)}

The client's requested adjustment: "${request}"

TASK: Make ONLY the specific adjustment requested. Do not change anything else unless it is directly related to the request. For example:
- If they want more warm-up, only modify the warmup blocks
- If they want to include a specific machine, replace only the relevant exercise
- If they want to reduce volume, reduce sets/reps in the relevant sessions

Return the COMPLETE updated plan in EXACTLY the same JSON structure as the input. No extra text, no markdown, just the raw JSON.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 6000, temperature: 0.3 },
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
