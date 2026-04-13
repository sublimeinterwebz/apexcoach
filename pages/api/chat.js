const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!GEMINI_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  const { messages, systemPrompt } = req.body;

  try {
    const contents = [
      { role: "user",  parts: [{ text: systemPrompt + "\n\nNow respond to the conversation:" }] },
      { role: "model", parts: [{ text: "Understood. I am ApexCoach, ready to help." }] },
      ...messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    ];

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.8, maxOutputTokens: 500 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data?.error?.message || "Gemini error" });
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I could not respond.";
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
