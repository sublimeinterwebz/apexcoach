// TEMPORARY — delete after use
export default async function handler(req, res) {
  const apiKey = process.env.EXERCISEDB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "no key" });

  try {
    const r = await fetch(
      "https://exercisedb.p.rapidapi.com/exercises?limit=1500&offset=0",
      { headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" } }
    );
    const data = await r.json();
    // Return only the fields we need: id, name, equipment, bodyPart, target
    const slim = data.map(e => ({
      id: e.id,
      name: e.name,
      equipment: e.equipment,
      bodyPart: e.bodyPart,
      target: e.target,
    }));
    return res.status(200).json(slim);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
