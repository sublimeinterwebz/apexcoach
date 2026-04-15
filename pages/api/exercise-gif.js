// Step 1: search by name → get exercise ID
// Step 2: proxy the GIF stream (keeps API key server-side)

const idCache  = new Map(); // name → exerciseId
const nilCache = new Set();  // names confirmed to have no match

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Missing name" });

  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey) return res.status(200).json({ gif: null });

  const key = name.toLowerCase().trim();

  // Already confirmed no match
  if (nilCache.has(key)) return res.status(200).json({ gif: null });

  try {
    // Step 1: get exercise ID (cached)
    let exerciseId = idCache.get(key);

    if (!exerciseId) {
      const searchRes = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(key)}?limit=1&offset=0`,
        { headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" } }
      );
      const data = await searchRes.json();
      exerciseId = data?.[0]?.id || null;

      if (!exerciseId) { nilCache.add(key); return res.status(200).json({ gif: null }); }
      idCache.set(key, exerciseId);
    }

    // Step 2: stream the GIF through our proxy (key stays server-side)
    const gifRes = await fetch(
      `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=180&rapidapi-key=${apiKey}`,
      { headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" } }
    );

    if (!gifRes.ok) return res.status(200).json({ gif: null });

    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24h in browser

    const buffer = await gifRes.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    return res.status(200).json({ gif: null });
  }
}
