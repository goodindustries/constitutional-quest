// Tiny share counter backed by Netlify Blobs, rate-limited to 2 per IP.
//   GET  /api/shares  → { count }                       (read the total)
//   POST /api/shares  → { count, capped? } and +1        (count a share)
import { getStore } from '@netlify/blobs';

const KEY = 'shareCount';
const MAX_PER_IP = 2;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
  });
}

export default async (req) => {
  // Manual CLI deploys don't auto-inject the Blobs context, so pass it explicitly.
  const store = getStore({
    name: 'quest-stats',
    siteID: process.env.BLOB_SITE_ID,
    token: process.env.BLOB_TOKEN
  });

  if (req.method === 'POST') {
    // identify the caller; Netlify sets this header at the edge
    const ip = req.headers.get('x-nf-client-connection-ip')
            || req.headers.get('x-forwarded-for')?.split(',')[0].trim()
            || 'unknown';
    const ipKey = `ip:${ip}`;

    const used = Number(await store.get(ipKey, { consistency: 'strong' })) || 0;
    if (used >= MAX_PER_IP) {
      const count = Number(await store.get(KEY, { consistency: 'strong' })) || 0;
      return json({ count, capped: true });   // already at their limit — don't increment
    }
    await store.set(ipKey, String(used + 1));

    const cur = Number(await store.get(KEY, { consistency: 'strong' })) || 0;
    const next = cur + 1;
    await store.set(KEY, String(next));
    return json({ count: next });
  }

  const count = Number(await store.get(KEY, { consistency: 'strong' })) || 0;
  return json({ count });
};

export const config = { path: '/api/shares' };
