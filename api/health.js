// Simple Vercel Serverless Function to verify runtime logging and env vars.
export default function handler(req, res) {
  try {
    console.log('[api/health] request received', {
      method: req.method,
      url: req.url,
      headers: { host: req.headers.host }
    });
    // Log presence of key env vars (do NOT print secrets)
    console.log('[api/health] env presence', {
      DATABASE_URL: !!process.env.DATABASE_URL,
      VITE_BACKEND_URL: !!process.env.VITE_BACKEND_URL,
      NODE_ENV: process.env.NODE_ENV || null
    });
  } catch (e) {
    console.log('[api/health] logging failed', String(e));
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
}
