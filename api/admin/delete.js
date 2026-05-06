/* ========================================================
   POST /api/admin/delete
   Body: { id: "sub_..." }
   - Removes a single submission by id
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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  // Auth
  const expected = process.env.ADMIN_TOKEN;
  const provided = req.headers['x-admin-token'] || (req.query && req.query.token);
  if (!expected || provided !== expected) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const id = body && body.id;
  if (!id) {
    res.status(400).json({ error: 'missing_id' });
    return;
  }

  let removed = 0;

  if (kv) {
    try {
      // Read all, filter out matching id, rewrite list
      const raw = await kv.lrange(KV_LIST_KEY, 0, -1);
      const items = (raw || []).map(item => {
        if (typeof item === 'string') {
          try { return JSON.parse(item); } catch (e) { return null; }
        }
        return item;
      }).filter(Boolean);

      const filtered = items.filter(it => it.id !== id);
      removed = items.length - filtered.length;

      if (removed > 0) {
        // Atomic-ish: clear and reinsert
        await kv.del(KV_LIST_KEY);
        if (filtered.length) {
          // lpush in reverse so first item ends at index 0 (most recent)
          for (let i = filtered.length - 1; i >= 0; i--) {
            await kv.lpush(KV_LIST_KEY, JSON.stringify(filtered[i]));
          }
        }
      }
    } catch (err) {
      console.error('KV delete failed:', err);
      res.status(500).json({ error: 'kv_error' });
      return;
    }
  } else if (Array.isArray(globalThis.__tcn_inmemory)) {
    const before = globalThis.__tcn_inmemory.length;
    globalThis.__tcn_inmemory = globalThis.__tcn_inmemory.filter(it => it.id !== id);
    removed = before - globalThis.__tcn_inmemory.length;
  }

  res.status(200).json({ ok: true, removed });
};
