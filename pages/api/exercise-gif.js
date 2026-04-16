const exercisesData = require("../../data/exercises.json");

// Build name→id map once at cold start
const nameToId = new Map();
for (const ex of exercisesData) {
  if (ex.id && ex.name) nameToId.set(ex.name.toLowerCase().trim(), ex.id);
}

const STOP = new Set(['a','an','the','and','or','of','in','on','at','to','for','with',
  'per','side','each','set','sets','rep','reps','hold','both','single','one','two','slow']);

function clean(raw) {
  let s = raw.toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\/.*$/, '')
    .replace(/[^a-z0-9 ]/g, ' ');
  const plurals = [['stretches','stretch'],['rotations','rotation'],['deadlifts','deadlift'],
    ['rows','row'],['aparts','apart'],['squats','squat'],['curls','curl'],
    ['presses','press'],['raises','raise'],['pulls','pull'],['backs','back']];
  for (const [from, to] of plurals)
    s = s.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  return s.replace(/\s+/g, ' ').trim();
}

function keywords(s) {
  return s.split(' ').filter(w => w.length > 2 && !STOP.has(w));
}

function findExerciseId(name) {
  // 1. Exact match
  const exact = name.toLowerCase().trim();
  if (nameToId.has(exact)) return nameToId.get(exact);

  // 2. Cleaned match
  const cl = clean(name);
  if (nameToId.has(cl)) return nameToId.get(cl);

  // 3. Word-overlap — require ≥2 shared keywords AND Jaccard ≥0.25
  const qwords = keywords(cl);
  if (qwords.length === 0) return null;

  let bestScore = 0, bestId = null;
  for (const [key, id] of nameToId) {
    const kwords = new Set(keywords(key));
    const hits = qwords.filter(w => kwords.has(w)).length;
    if (hits < 2) continue;
    const union = new Set([...qwords, ...kwords]).size;
    const score = hits / union;
    if (score > bestScore) { bestScore = score; bestId = id; }
  }

  return bestScore >= 0.25 ? bestId : null;
}

const gifCache = new Map(); // exerciseId → Buffer

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { name } = req.query;
  if (!name) return res.status(400).end();

  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey) return res.status(500).end();

  const exerciseId = findExerciseId(name);
  if (!exerciseId) return res.status(404).end();

  // Serve from cache if available
  if (gifCache.has(exerciseId)) {
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(gifCache.get(exerciseId));
  }

  try {
    // Fetch live GIF from RapidAPI using exercise ID
    const r = await fetch(
      `https://exercisedb.p.rapidapi.com/image?exerciseId=${exerciseId}&resolution=180&rapidapi-key=${apiKey}`,
      { headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      }}
    );

    if (!r.ok) return res.status(404).end();

    const buf = Buffer.from(await r.arrayBuffer());
    gifCache.set(exerciseId, buf);

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buf);
  } catch {
    return res.status(404).end();
  }
}
