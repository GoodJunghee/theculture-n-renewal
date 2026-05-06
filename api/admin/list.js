/* ========================================================
   GET /api/admin/list
   - Returns all submissions (admin only)
   - Auth: ID + Password (headers x-admin-id, x-admin-token)
   - Defaults: theculture / 1q2w3e4r!  (overridable via env)
   ======================================================== */

const KV_LIST_KEY = 'tcn:submissions';

// Default credentials (can be overridden via Vercel env vars)
const DEFAULT_ADMIN_ID = 'theculture';
const DEFAULT_ADMIN_PASSWORD = '1q2w3e4r!';

function checkAuth(req) {
  const expectedId = process.env.ADMIN_ID || DEFAULT_ADMIN_ID;
  const expectedPw = process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || DEFAULT_ADMIN_PASSWORD;

  const id = req.headers['x-admin-id'] || (req.query && req.query.id) || '';
  const pw = req.headers['x-admin-token'] || req.headers['x-admin-password'] || (req.query && req.query.token) || '';

  return id === expectedId && pw === expectedPw;
}

function getRedis() {
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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!checkAuth(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const limit = Math.min(parseInt((req.query && req.query.limit) || '200', 10) || 200, 1000);

  let submissions = [];
  const redis = getRedis();
  let storage = 'memory';

  if (redis) {
    try {
      const raw = await redis.lrange(KV_LIST_KEY, 0, limit - 1);
      submissions = (raw || []).map(item => {
        if (typeof item === 'string') {
          try { return JSON.parse(item); } catch (e) { return null; }
        }
        return item;
      }).filter(Boolean);
      storage = 'upstash-redis';
    } catch (err) {
      console.error('Redis lrange failed:', err);
    }
  }

  if (!submissions.length && Array.isArray(globalThis.__tcn_inmemory)) {
    submissions = globalThis.__tcn_inmemory.slice(0, limit);
  }

  res.status(200).json({
    ok: true,
    count: submissions.length,
    submissions,
    storage,
  });
};
