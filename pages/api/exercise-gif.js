const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { name, debug } = req.query;
  if (!name) return res.status(400).json({ error: "Missing exercise name" });

  const key = name.toLowerCase().trim();
  if (cache.has(key) && !debug) return res.status(200).json({ gif: cache.get(key) });

  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey) return res.status(200).json({ gif: null, error: "no api key" });

  try {
    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(key)}?limit=1&offset=0`;
    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { return res.status(200).json({ gif: null, error: "parse failed", raw: text.slice(0,300) }); }

    // Debug mode — return full first result so we can see all field names
    if (debug) return res.status(200).json({ firstResult: data?.[0] || null, count: data?.length, status: response.status });

    if (!response.ok) return res.status(200).json({ gif: null });

    // Try multiple possible field names ExerciseDB has used
    const first = data?.[0];
    const gifUrl = first?.gifUrl || first?.gif || first?.image || first?.imageUrl || null;

    if (gifUrl) cache.set(key, gifUrl);
    return res.status(200).json({ gif: gifUrl });
  } catch (e) {
    return res.status(200).json({ gif: null, error: e.message });
  }
}
