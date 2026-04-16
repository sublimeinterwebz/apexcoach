const exercisesData = require("../../data/exercises.json");

// Build name→gifUrl map once at cold start
const nameMap = new Map();
for (const ex of exercisesData) {
  if (ex.gifUrl && ex.name) nameMap.set(ex.name.toLowerCase().trim(), ex.gifUrl);
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
  for (const [from, to] of plurals) s = s.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  return s.replace(/\s+/g, ' ').trim();
}

function keywords(s) {
  return s.split(' ').filter(w => w.length > 2 && !STOP.has(w));
}

function findGifUrl(name) {
  // 1. Exact match
  const exact = name.toLowerCase().trim();
  if (nameMap.has(exact)) return nameMap.get(exact);

  // 2. Cleaned match
  const cl = clean(name);
  if (nameMap.has(cl)) return nameMap.get(cl);

  // 3. Word-overlap match — strict: need ≥2 shared keywords AND Jaccard ≥0.25
  const qwords = keywords(cl);
  if (qwords.length === 0) return null;

  let bestScore = 0, bestUrl = null;
  for (const [key, url] of nameMap) {
    const kwords = new Set(keywords(key));
    const hits = qwords.filter(w => kwords.has(w)).length;
    if (hits < 2) continue;
    const union = new Set([...qwords, ...kwords]).size;
    const score = hits / union;
    if (score > bestScore) { bestScore = score; bestUrl = url; }
  }

  return bestScore >= 0.25 ? bestUrl : null;
}

const gifCache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { name } = req.query;
  if (!name) return res.status(400).end();

  const gifUrl = findGifUrl(name);
  if (!gifUrl) return res.status(404).end();

  if (gifCache.has(gifUrl)) {
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(gifCache.get(gifUrl));
  }

  try {
    const r = await fetch(gifUrl);
    if (!r.ok) return res.status(404).end();
    const buf = Buffer.from(await r.arrayBuffer());
    gifCache.set(gifUrl, buf);
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buf);
  } catch {
    return res.status(404).end();
  }
}
