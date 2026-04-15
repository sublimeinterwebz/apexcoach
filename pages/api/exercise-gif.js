const idCache  = new Map();
const nilCache = new Set();

// Strip parentheticals, slash alternatives, clean for ExerciseDB search
function cleanName(raw) {
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, "")        // remove (Pendlay Rows)
    .replace(/\/.*$/,   "")         // remove / Lat Pulldowns
    .replace(/[^a-z0-9 ]/g, " ")   // remove special chars
    .replace(/\s+/g, " ")
    .trim();
}

// Build fallback search terms to try in order
function searchTerms(name) {
  const clean = cleanName(name);
  const words = clean.split(" ").filter(Boolean);
  const terms = [clean];
  // Try first 3 words (drops trailing descriptors)
  if (words.length > 3) terms.push(words.slice(0, 3).join(" "));
  // Try first 2 words
  if (words.length > 2) terms.push(words.slice(0, 2).join(" "));
  return [...new Set(terms)];
}

async function searchExercise(term, apiKey) {
  const res = await fetch(
    `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(term)}?limit=1&offset=0`,
    { headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.id || null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { name } = req.query;
  if (!name) return res.status(400).end();

  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey) return res.status(404).end();

  const cacheKey = name.toLowerCase().trim();

  if (nilCache.has(cacheKey)) return res.status(404).end();

  try {
    // Check ID cache first
    let exerciseId = idCache.get(cacheKey);

    if (!exerciseId) {
      // Try each search term in order until one works
      const terms = searchTerms(name);
      for (const term of terms) {
        exerciseId = await searchExercise(term, apiKey);
        if (exerciseId) break;
      }

      if (!exerciseId) {
        nilCache.add(cacheKey);
        return res.status(404).end(); // img onError will fire → "No demo available"
      }
      idCache.set(cacheKey, exerciseId);
    }

    // Fetch and stream the GIF
    const gifRes = await fetch(
      `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=180&rapidapi-key=${apiKey}`,
      { headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" } }
    );

    if (!gifRes.ok) {
      nilCache.add(cacheKey);
      return res.status(404).end();
    }

    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buffer = await gifRes.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));

  } catch (e) {
    return res.status(404).end();
  }
}
