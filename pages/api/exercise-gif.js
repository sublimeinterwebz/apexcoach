// Server-side proxy for ExerciseDB — keeps API key off client, adds in-memory cache

const cache = new Map(); // exercise name → gif url

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Missing exercise name" });

  const key = name.toLowerCase().trim();

  // Return cached result immediately
  if (cache.has(key)) {
    return res.status(200).json({ gif: cache.get(key) });
  }

  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing API key" });

  try {
    // Search ExerciseDB by name
    const searchUrl = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(key)}?limit=1&offset=0`;
    const response = await fetch(searchUrl, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      return res.status(200).json({ gif: null }); // graceful fallback
    }

    const data = await response.json();
    const gifUrl = data?.[0]?.gifUrl || null;

    // Cache for the lifetime of this serverless function instance
    if (gifUrl) cache.set(key, gifUrl);

    return res.status(200).json({ gif: gifUrl });
  } catch (e) {
    return res.status(200).json({ gif: null }); // always fail gracefully
  }
}
