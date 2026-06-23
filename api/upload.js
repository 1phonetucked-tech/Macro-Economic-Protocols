// Vercel Serverless Function — uploads a pasted/dropped reference image to
// Vercel Blob and returns its public URL.
//
// Loads the ESM @vercel/blob SDK via dynamic import so this stays a CommonJS
// function alongside next-number.js (no "type":"module" needed).
//
// Auth — set up when you connect a Vercel Blob store to the project
// (Storage > Blob > connect). Two modes are supported:
//   - Static token:  BLOB_READ_WRITE_TOKEN  (legacy "connect" flow)
//   - OIDC:          BLOB_STORE_ID          (current "connect" flow; the SDK
//                    auto-uses the runtime-injected VERCEL_OIDC_TOKEN)
// If neither is present (or the upload fails) we respond non-200 so the client
// degrades gracefully and the form still submits (just without that image).

const MAX_BYTES = 6 * 1024 * 1024; // decoded cap; the client downscales first

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;
  if (!token && !storeId) {
    res.status(503).json({ error: 'blob not configured' });
    return;
  }

  try {
    // Body: { dataUrl: "data:image/jpeg;base64,...." }
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const dataUrl = body && body.dataUrl;
    const m = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!m) {
      res.status(400).json({ error: 'expected an image data url' });
      return;
    }
    const contentType = m[1];
    const buffer = Buffer.from(m[2], 'base64');
    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      res.status(413).json({ error: 'image too large' });
      return;
    }

    const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const name = `commission-refs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { put } = await import('@vercel/blob');
    const opts = { access: 'public', contentType, addRandomSuffix: false };
    // Static-token mode: pass it explicitly. OIDC mode: omit token and let the
    // SDK fall back to VERCEL_OIDC_TOKEN + BLOB_STORE_ID automatically.
    if (token) opts.token = token;
    const blob = await put(name, buffer, opts);

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ url: blob.url });
  } catch (err) {
    res.status(500).json({ error: 'upload failed' });
  }
};
