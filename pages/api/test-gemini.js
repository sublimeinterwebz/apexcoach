export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

  const result = {
    keyPresent: !!key,
    keyPrefix: key ? key.slice(0, 8) + "..." : "MISSING",
    models: {},
  };

  if (!key) {
    return res.status(200).json({ ...result, error: "No API key found in environment" });
  }

  // Test each model with a minimal prompt
  for (const model of ["gemini-2.5-flash", "gemini-2.5-flash-preview-04-17"]) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Say: OK" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      );
      const data = await r.json();
      if (r.ok) {
        result.models[model] = { status: "OK", response: data?.candidates?.[0]?.content?.parts?.[0]?.text };
      } else {
        result.models[model] = { status: "ERROR", httpStatus: r.status, error: data?.error };
      }
    } catch (e) {
      result.models[model] = { status: "FETCH_ERROR", error: e.message };
    }
  }

  return res.status(200).json(result);
}
