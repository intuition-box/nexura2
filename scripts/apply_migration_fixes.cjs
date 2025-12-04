#!/usr/bin/env node
require('dotenv').config({ path: './.env.local' });
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Checking quests table for is_active column...');
    const qcol = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='quests' AND column_name='is_active'`);
    if (qcol.rows.length === 0) {
      console.log('Adding is_active column to quests...');
      await client.query(`ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_active integer DEFAULT 1`);
    } else {
      console.log('is_active column already present');
    }
    console.log('Creating index idx_quests_is_active if not exists...');
    try {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_quests_is_active ON quests(is_active)`);
    } catch (e) {
      console.warn('Failed to create idx_quests_is_active:', e.message || e);
    }

    // Create user_quest_completions if not exists
    const exists = await client.query(`SELECT to_regclass('public.user_quest_completions') as reg`);
    if (!exists.rows[0].reg) {
      console.log('Creating user_quest_completions table (compatible with existing users.id type)...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_quest_completions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          quest_id TEXT NOT NULL,
          xp_awarded INTEGER NOT NULL DEFAULT 0,
          completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(user_id, quest_id)
        )
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_quest_completions_user ON user_quest_completions(user_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_quest_completions_quest ON user_quest_completions(quest_id)`);
      console.log('Created user_quest_completions successfully');
    } else {
      console.log('user_quest_completions already exists');
    }

    console.log('Fixes applied.');
  } catch (e) {
    console.error('Error applying fixes:', e.message || e);
    process.exit(1);
  } finally {
    try { client.release(); } catch (e) {}
    try { await pool.end(); } catch (e) {}
  }
})();