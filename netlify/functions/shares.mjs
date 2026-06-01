// Tiny share counter backed by Netlify Blobs.
//   GET  /api/shares  → { count }                (read the total)
//   POST /api/shares  → { count } and increments  (count a share)
import { getStore } from '@netlify/blobs';

export default async (req) => {
  // Manual CLI deploys don't auto-inject the Blobs context, so pass it explicitly.
  const store = getStore({
    name: 'quest-stats',
    siteID: process.env.BLOB_SITE_ID,
    token: process.env.BLOB_TOKEN
  });
  const KEY = 'shareCount';

  let count = Number(await store.get(KEY)) || 0;

  if (req.method === 'POST') {
    count += 1;
    await store.set(KEY, String(count));
  }

  return new Response(JSON.stringify({ count }), {
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
  });
};

export const config = { path: '/api/shares' };
