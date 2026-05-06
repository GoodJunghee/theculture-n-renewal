/* ========================================================
   POST /api/submit
   - Receives lead form submissions
   - Stores in Vercel KV (if configured) or in-memory dev fallback
   - Returns 200 + submission id
   ======================================================== */

let kv = null;
try {
  // Lazy import so the file works even when @vercel/kv isn't installed in dev
  kv = require('@vercel/kv').kv;
} catch (e) {
  kv = null;
}

const KV_LIST_KEY = 'tcn:submissions';

// In-memory fallback for local dev only (NOT persistent across cold starts)
globalThis.__tcn_inmemory = globalThis.__tcn_inmemory || [];

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    null
  );
}

function sanitizeString(v) {
  if (typeof v !== 'string') return v;
  // Strip control chars + length limit
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

  // Parse body (Vercel auto-parses JSON for application/json)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  // Sanitize
  const data = sanitizePayload(body);

  // Server-side required validation (minimal)
  if (!data.name || !data.phone) {
    res.status(400).json({ error: 'missing_required', fields: ['name', 'phone'] });
    return;
  }

  // Build submission record
  const id = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const submission = {
    id,
    submitted_at: new Date().toISOString(),
    ip: getClientIp(req),
    referer: req.headers.referer || null,
    ...data,
  };

  // Store
  let stored = false;
  if (kv) {
    try {
      // Push as JSON string to a list (KV LIST is supported)
      await kv.lpush(KV_LIST_KEY, JSON.stringify(submission));
      stored = true;
    } catch (err) {
      console.error('KV lpush failed:', err);
    }
  }

  if (!stored) {
    // Fallback: in-memory (dev only)
    globalThis.__tcn_inmemory.unshift(submission);
    if (globalThis.__tcn_inmemory.length > 200) {
      globalThis.__tcn_inmemory.length = 200;
    }
  }

  res.status(200).json({
    ok: true,
    id,
    persisted: stored ? 'kv' : 'memory',
  });
};
