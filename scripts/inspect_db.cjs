#!/usr/bin/env node
// inspect_db.cjs - prints schema info for debugging migrations
require('dotenv').config({ path: './.env.local' });
(async () => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const tables = ['quests','users','user_profiles','user_quest_completions'];
    try {
      const tlist = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
      console.log('\n== public tables:');
      console.log(tlist.rows.map(r => r.table_name).join(', '));
    } catch (e) {
      console.warn('failed to list public tables', e.message || e);
    }
    for (const t of tables) {
      try {
        const r = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`, [t]);
        console.log(`\n== table: ${t} (${r.rows.length} columns)`);
        console.table(r.rows);
      } catch (e) {
        console.log(`\n== table: ${t} (error reading columns)`, e.message || e);
      }
    }
    try {
      const cls = await pool.query(`SELECT relname, relkind FROM pg_class WHERE relname = 'user_quest_completions'`);
      console.log('\npg_class for user_quest_completions:', cls.rows);
      if (cls.rows && cls.rows.length && cls.rows[0].relkind === 'v') {
        const v = await pool.query(`SELECT pg_get_viewdef('user_quest_completions'::regclass, true) as def`);
        console.log('view definition:', v.rows[0].def);
      }
    } catch (e) {
      console.warn('failed to inspect pg_class for user_quest_completions', e.message || e);
    }

    await pool.end();
  } catch (e) {
    console.error('inspect error', e);
    process.exit(1);
  }
})();