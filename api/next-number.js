// Vercel Serverless Function — returns the next sequential request number.
// Backed by Vercel KV (Upstash-compatible REST). No npm deps; uses global fetch.
//
// Requires env vars (auto-injected when you connect a Vercel KV store to the project):
//   KV_REST_API_URL, KV_REST_API_TOKEN
// If they're missing or the call fails, responds 503 so the client falls back
// to a date-code reference and the form still works.

module.exports = async function handler(req, res) {
  // Accept either the Vercel KV (KV_*) or Upstash marketplace (UPSTASH_*) env var names.
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    res.status(503).json({ error: 'counter not configured' });
    return;
  }

  try {
    // Atomic increment of the counter key; first call returns 1 -> PT-001.
    const r = await fetch(`${url}/incr/pt:counter`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`kv responded ${r.status}`);
    const data = await r.json();
    const number = typeof data.result === 'number' ? data.result : parseInt(data.result, 10);
    if (!Number.isFinite(number)) throw new Error('bad counter value');

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ number });
  } catch (err) {
    res.status(503).json({ error: 'counter unavailable' });
  }
};
