#!/usr/bin/env -S node
// Simple script to query user_session_tokens table in Neon/Postgres
(async function(){
  try {
    const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];
    if(!DATABASE_URL){
      console.error('DATABASE_URL not provided via env or arg');
      process.exit(2);
    }
    const mod = await import('@neondatabase/serverless');
    const pool = mod.createPool(DATABASE_URL);
    const res = await pool.query('SELECT token, user_id, address, created_at FROM user_session_tokens ORDER BY created_at DESC LIMIT 20');
    console.log(JSON.stringify(res.rows || [], null, 2));
    try { await pool.end(); } catch(e){}
    process.exit(0);
  } catch (e) {
    console.error('error', e);
    process.exit(1);
  }
})();
