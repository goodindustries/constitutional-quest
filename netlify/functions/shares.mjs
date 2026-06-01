// Tiny share counter backed by Netlify Blobs.
//   GET  /api/shares  → { count }                (read the total)
//   POST /api/shares  → { count } and increments  (count a share)
import { getStore } from '@netlify/blobs';

const KEY = 'shareCount';

function json(obj) {
  return new Response(JSON.stringify(obj), {
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
    // strongly-consistent read so concurrent increments don't clobber each other
    const cur = Number(await store.get(KEY, { consistency: 'strong' })) || 0;
    const next = cur + 1;
    await store.set(KEY, String(next));
    return json({ count: next });
  }

  const count = Number(await store.get(KEY, { consistency: 'strong' })) || 0;
  return json({ count });
};

export const config = { path: '/api/shares' };
