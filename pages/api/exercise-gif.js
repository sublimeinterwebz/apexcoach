const exercisesData = require("../../data/exercises.json");

// Build name→gifUrl lookup at module load time
const nameMap = new Map();
for (const ex of exercisesData) {
  if (ex.gifUrl && ex.name) {
    nameMap.set(ex.name.toLowerCase().trim(), ex.gifUrl);
  }
}

function cleanName(raw) {
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\/.*$/,   "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findGifUrl(name) {
  const exact = name.toLowerCase().trim();
  if (nameMap.has(exact)) return nameMap.get(exact);

  const clean = cleanName(name);
  if (nameMap.has(clean)) return nameMap.get(clean);

  // Partial match — find any entry whose name starts with the first 3 words of query
  const words = clean.split(" ").slice(0, 3).join(" ");
  for (const [key, url] of nameMap) {
    if (key.startsWith(words)) return url;
  }
  return null;
}

const gifCache = new Map();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { name } = req.query;
  if (!name) return res.status(400).end();

  const gifUrl = findGifUrl(name);
  if (!gifUrl) return res.status(404).end();

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
