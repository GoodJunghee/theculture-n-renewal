/* ========================================================
   GET /api/admin/list
   - Returns all submissions (admin only)
   - Auth: header `x-admin-token` or query `?token=...` must match env ADMIN_TOKEN
   ======================================================== */

let kv = null;
try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  kv = null;
}

const KV_LIST_KEY = 'tcn:submissions';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Auth check
  const expected = process.env.ADMIN_TOKEN;
  const provided =
    req.headers['x-admin-token'] ||
    (req.query && req.query.token) ||
    null;

  if (!expected) {
    res.status(500).json({
      error: 'admin_token_not_configured',
      hint: 'Set ADMIN_TOKEN environment variable in Vercel dashboard.',
    });
    return;
  }
  if (!provided || provided !== expected) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  // Pagination
  const limit = Math.min(parseInt((req.query && req.query.limit) || '200', 10) || 200, 1000);

  let submissions = [];

  if (kv) {
    try {
      // KV stores as JSON strings in a list (most recent first via lpush)
      const raw = await kv.lrange(KV_LIST_KEY, 0, limit - 1);
      submissions = (raw || []).map(item => {
        if (typeof item === 'string') {
          try { return JSON.parse(item); } catch (e) { return null; }
        }
        return item;
      }).filter(Boolean);
    } catch (err) {
      console.error('KV lrange failed:', err);
    }
  }

  // Fallback: in-memory (dev only)
  if (!submissions.length && Array.isArray(globalThis.__tcn_inmemory)) {
    submissions = globalThis.__tcn_inmemory.slice(0, limit);
  }

  res.status(200).json({
    ok: true,
    count: submissions.length,
    submissions,
    storage: kv ? 'vercel-kv' : 'memory',
  });
};
