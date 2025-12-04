#!/usr/bin/env node
// Run this with: DATABASE_URL="<your neon connection string>" node scripts/run_migration_neon.js
const fs = require('fs');
const path = require('path');

async function run() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('Please set DATABASE_URL env var to your Neon/Postgres connection string');
    process.exit(1);
  }

  let pool;
  try {
    // Prefer Neon serverless pool if available
    const { createPool } = require('@neondatabase/serverless');
    pool = createPool(DATABASE_URL);
  } catch (e) {
    // Fall back to 'pg' client
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: DATABASE_URL });
  }

  const migrationPath = path.join(__dirname, '..', 'server', 'migrations', '001_create_user_session_tokens.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    const client = await pool.connect();
    try {
      console.log('Applying migration...');
      await client.query(sql);
      console.log('Migration applied successfully.');
    } finally {
      // release depends on pool type
      if (client.release) await client.release();
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    try { if (pool.end) await pool.end(); } catch (e) {}
  }
}

run();
