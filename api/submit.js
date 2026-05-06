/* ========================================================
   POST /api/submit
   - Receives lead form submissions
   - Stores in Upstash Redis (via Vercel Marketplace)
   - Falls back to in-memory if Redis env vars are not set
   - Returns 200 + submission id
   ======================================================== */

const KV_LIST_KEY = 'tcn:submissions';

// Lazy-load Redis only when env vars exist
function getRedis() {
  // Support both Vercel KV (legacy) and Upstash Redis (Marketplace) env vars
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    null;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    null;

  if (!url || !token) return null;

  try {
    const { Redis } = require('@upstash/redis');
    return new Redis({ url, token });
  } catch (err) {
    console.error('Failed to init Redis:', err);
    return null;
  }
}

// In-memory fallback (NOT persistent across cold starts)
globalThis.__tcn_inmemory = globalThis.__tcn_inmemory || [];

function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    (req.socket && req.socket.remoteAddress) ||
    null
  );
}

function sanitizeString(v) {
  if (typeof v !== 'string') return v;
  return v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, 4000);
}

function sanitizePayload(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.length > 64) continue;
    const cleanKey = k.replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!cleanKey) continue;
    if (typeof v === 'string') {
      out[cleanKey] = sanitizeString(v);
    } else if (Array.isArray(v)) {
      out[cleanKey] = v.slice(0, 20).map(x => (typeof x === 'string' ? sanitizeString(x) : x));
    } else if (v === null || typeof v === 'number' || typeof v === 'boolean') {
      out[cleanKey] = v;
    }
  }
  return out;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const data = sanitizePayload(body);

  if (!data.name || !data.phone) {
    res.status(400).json({ error: 'missing_required', fields: ['name', 'phone'] });
    return;
  }

  const id = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const submission = {
    id,
    submitted_at: new Date().toISOString(),
    ip: getClientIp(req),
    referer: req.headers.referer || null,
    ...data,
  };

  let stored = false;
  const redis = getRedis();

  if (redis) {
    try {
      await redis.lpush(KV_LIST_KEY, JSON.stringify(submission));
      stored = true;
    } catch (err) {
      console.error('Redis lpush failed:', err);
    }
  }

  if (!stored) {
    globalThis.__tcn_inmemory.unshift(submission);
    if (globalThis.__tcn_inmemory.length > 200) {
      globalThis.__tcn_inmemory.length = 200;
    }
  }

  res.status(200).json({
    ok: true,
    id,
    persisted: stored ? 'redis' : 'memory',
  });
};
