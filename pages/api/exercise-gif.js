const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Missing exercise name" });

  const key = name.toLowerCase().trim();
  if (cache.has(key)) return res.status(200).json({ gif: cache.get(key) });

  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey) return res.status(200).json({ gif: null, debug: "no api key" });

  try {
    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(key)}?limit=1&offset=0`;
    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    });

    const text = await response.text();
    console.log(`ExerciseDB [${response.status}] for "${key}":`, text.slice(0, 200));

    if (!response.ok) {
      return res.status(200).json({ gif: null, debug: `api error ${response.status}`, raw: text.slice(0, 200) });
    }

    const data = JSON.parse(text);
    const gifUrl = data?.[0]?.gifUrl || null;
    if (gifUrl) cache.set(key, gifUrl);

    return res.status(200).json({ gif: gifUrl, count: data?.length });
  } catch (e) {
    return res.status(200).json({ gif: null, debug: e.message });
  }
}
