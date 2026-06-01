// Tiny share counter backed by Netlify Blobs.
//   GET  /api/shares  → { count }                (read the total)
//   POST /api/shares  → { count } and increments  (count a share)
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const store = getStore('quest-stats');
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
