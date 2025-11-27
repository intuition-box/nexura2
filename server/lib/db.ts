// Neon/Postgres helper for both serverless (Vercel) and long-running servers.
// Uses @neondatabase/serverless createPool when available which is optimized for serverless.

import { createRequire } from 'module';

let pool: any = null;
const conn = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
if (!conn) {
  console.warn('No DATABASE_URL / NEON_DATABASE_URL configured — DB operations will fail if invoked.');
} else {
  try {
    // Prefer the @neondatabase/serverless package which exposes createPool
    const req = createRequire(import.meta.url);
    try {
      const mod = req('@neondatabase/serverless');
      const createPool = (mod as any).createPool || (mod as any).default?.createPool;
      if (typeof createPool === 'function') {
        pool = createPool(conn);
      }
    } catch (e) {
      // fallback to pg if neondatabase package is not available
    }

    if (!pool) {
      // Lazy-load pg as fallback
      try {
        const { Pool } = req('pg');
        // Use a small max pool size for serverless environments; allow override via env
        const maxClients = parseInt(process.env.PG_MAX_CLIENTS || '5', 10) || 5;
        pool = new Pool({ connectionString: conn, max: maxClients });
      } catch (e) {
        console.warn('Failed to initialize any Postgres pool. Install @neondatabase/serverless or pg.');
      }
    }
  } catch (e) {
    console.warn('DB init error', e);
  }
}

export async function query(text: string, params?: any[]) {
  if (!pool) throw new Error('No DB pool configured');
  // @neondatabase/serverless pool API is compatible with pg Pool
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    // Some Neon pools don't need explicit release, but call if present
    try { client.release(); } catch (e) { /* ignore */ }
  }
}

export default pool;
