#!/usr/bin/env node
// Run this with: DATABASE_URL="<your neon connection string>" node scripts/run_migration_neon.cjs
const fs = require('fs');
const path = require('path');

async function run() {
  // Allow DATABASE_URL to come from process env or from .env.local for convenience
  let DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    try {
      // attempt to load dotenv .env.local if present
      const dotenv = require('dotenv');
      const path = require('path');
      const envPath = path.resolve(process.cwd(), '.env.local');
      dotenv.config({ path: envPath });
      DATABASE_URL = process.env.DATABASE_URL;
    } catch (e) {
      // ignore
    }
  }

  if (!DATABASE_URL) {
    console.error('Please set DATABASE_URL env var to your Neon/Postgres connection string or add it to .env.local');
    process.exit(1);
  }

  let pool;
  // Try to use the Neon serverless pool, otherwise fall back to pg.
  try {
    const neon = require('@neondatabase/serverless');
    if (neon && neon.createPool) {
      pool = neon.createPool(DATABASE_URL);
    }
  } catch (e) {
    // ignore and try pg next
  }

  if (!pool) {
    try {
      const { Pool } = require('pg');
      console.log('Using DATABASE_URL:', DATABASE_URL);
      pool = new Pool({ connectionString: DATABASE_URL });
    } catch (e) {
      console.error('Neither @neondatabase/serverless nor pg are installed. Install one of them and try again.');
      console.error('e.g. npm install @neondatabase/serverless  OR  npm install pg');
      process.exit(1);
    }
  }

  const migrationsDir = path.join(__dirname, '..', 'server', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found:', migrationsDir);
    process.exit(1);
  }

  // Read all .sql files and sort them to run in order
  const files = fs.readdirSync(migrationsDir).filter(f => f.toLowerCase().endsWith('.sql')).sort();
  if (files.length === 0) {
    console.log('No migration files found.');
    process.exit(0);
  }

  const client = await pool.connect();
  try {
    const failed = [];
    for (const fileName of files) {
      const migrationPath = path.join(migrationsDir, fileName);
      console.log(`\n--- Applying migration: ${fileName}`);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      try {
        await client.query(sql);
        console.log(`Applied ${fileName}`);
      } catch (err) {
        console.error(`Failed to apply ${fileName}:`, err && err.message ? err.message : err);
        if (err && err.stack) console.error(err.stack);
        failed.push({ file: fileName, error: String(err && err.message ? err.message : err) });
        console.warn('Continuing to next migration (some files may need manual attention).');
      }
    }

    if (failed.length > 0) {
      console.error('\nSome migrations failed to apply:');
      failed.forEach(f => console.error(` - ${f.file}: ${f.error}`));
      console.error('\nPlease inspect the failing migration files and your DB schema. You may need to alter existing tables or run the SQL manually.');
      process.exit(1);
    }
    console.log('\nAll migrations applied successfully.');
  } finally {
    try { if (typeof client.release === 'function') client.release(); } catch (e) {}
    try { if (typeof pool.end === 'function') await pool.end(); } catch (e) {}
  }
}

run();
