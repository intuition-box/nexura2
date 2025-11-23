#!/usr/bin/env node
// migrate_sessions_to_db.cjs
// Usage:
//  node migrate_sessions_to_db.cjs --from-server --server http://localhost:5051 --secret mysecret
//  node migrate_sessions_to_db.cjs --file ./server/data/legacy_session_tokens.json

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--from-server') out.fromServer = true;
    else if (a === '--server') out.server = args[++i];
    else if (a === '--secret') out.secret = args[++i];
    else if (a === '--file') out.file = args[++i];
    else if (a === '--db') out.db = args[++i];
    else if (a === '--help') out.help = true;
  }
  return out;
}

async function fetchSessionsFromServer(server, secret) {
  const url = new URL((server || 'http://localhost:5051') + '/__admin/export-sessions');
  const lib = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const opts = {
      method: 'GET',
      headers: {}
    };
    if (secret) opts.headers['x-debug-secret'] = secret;
    const req = lib.request(url, opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c.toString());
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed.sessions) resolve(parsed.sessions);
          else reject(new Error('no sessions in response'));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function readFileTokens(file) {
  const content = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && parsed.sessions) return parsed.sessions;
  throw new Error('unknown file format');
}

async function insertIntoDb(sessions, dbUrl) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: dbUrl });
  try {
    const client = await pool.connect();
    try {
      let migrated = 0;
      for (const s of sessions) {
        const token = s.token || s.tokenString || s.id || s.key;
        const address = (s.address || s.addr || null);
        const createdAt = s.createdAt ? new Date(s.createdAt) : new Date();
        // user_id may not be known here; leave null
        try {
          await client.query(`INSERT INTO user_session_tokens (token, user_id, address, created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (token) DO NOTHING`, [token, null, address, createdAt]);
          migrated++;
        } catch (e) {
          console.warn('failed to insert token', token, e.message || e);
        }
      }
      console.log(`Inserted ${migrated} tokens into DB`);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

(async function main() {
  try {
    const opts = parseArgs();
    if (opts.help) {
      console.log('Usage:\n --from-server --server <url> --secret <secret>\n --file <path> --db <DATABASE_URL>');
      process.exit(0);
    }

    let sessions = null;
    if (opts.fromServer) {
      const server = opts.server || process.env.SERVER_URL || 'http://localhost:5051';
      const secret = opts.secret || process.env.DEBUG_SESSION_SECRET;
      console.log('Fetching sessions from server', server);
      sessions = await fetchSessionsFromServer(server, secret);
    } else if (opts.file) {
      const file = path.resolve(opts.file);
      console.log('Reading sessions from file', file);
      sessions = await readFileTokens(file);
    } else {
      // try common locations
      const fallback = path.resolve(__dirname, '../server/data/legacy_session_tokens.json');
      if (fs.existsSync(fallback)) {
        console.log('Reading sessions from fallback file', fallback);
        sessions = await readFileTokens(fallback);
      }
    }

    if (!sessions) {
      console.error('No sessions found to migrate. Provide --from-server or --file or ensure server/data/legacy_session_tokens.json exists.');
      process.exit(2);
    }

    const dbUrl = opts.db || process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('No DATABASE_URL provided. Pass --db or set DATABASE_URL env var.');
      process.exit(2);
    }

    console.log(`Migrating ${sessions.length} sessions to DB...`);
    await insertIntoDb(sessions, dbUrl);
    console.log('Done.');
  } catch (e) {
    console.error('Migration failed', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
