// Looks up exercise by name in local exercises.json → fetches GIF from exercisedb.io
// No RapidAPI search call needed — name → gifUrl is a local lookup

import exercisesData from "../../data/exercises.json";

// Build lookup map at module load time (runs once per cold start)
const nameMap = new Map();
for (const ex of exercisesData) {
  if (ex.gifUrl) {
    nameMap.set(ex.name.toLowerCase().trim(), ex.gifUrl);
  }
}

function cleanName(raw) {
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, "")     // strip (Pendlay) etc
    .replace(/\/.*$/,   "")      // strip /alternative
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findGifUrl(name) {
  // 1. Exact match
  if (nameMap.has(name.toLowerCase().trim())) {
    return nameMap.get(name.toLowerCase().trim());
  }
  // 2. Cleaned match
  const clean = cleanName(name);
  if (nameMap.has(clean)) return nameMap.get(clean);

  // 3. Partial: find any entry whose name contains the cleaned query
  for (const [key, url] of nameMap) {
    if (key.includes(clean) || clean.includes(key.split(" ").slice(0,3).join(" "))) {
      return url;
    }
  }
  return null;
}

const gifCache = new Map(); // name → fetched buffer (avoid re-fetching same GIF)

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { name } = req.query;
  if (!name) return res.status(400).end();

  const gifUrl = findGifUrl(name);
  if (!gifUrl) return res.status(404).end();

  // Serve from memory cache if available
  if (gifCache.has(gifUrl)) {
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(gifCache.get(gifUrl));
  }

  try {
    const r = await fetch(gifUrl);
    if (!r.ok) return res.status(404).end();

    const buf = Buffer.from(await r.arrayBuffer());
    gifCache.set(gifUrl, buf);

    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(buf);
  } catch {
    return res.status(404).end();
  }
}
