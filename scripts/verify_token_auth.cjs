#!/usr/bin/env node
// verify_token_auth.cjs
// Usage: node scripts/verify_token_auth.cjs --token <token> --db <DATABASE_URL>

(function(){
  // simple arg parser
  const raw = process.argv.slice(2);
  const argv = {};
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a === '--token' || a === '-t') { argv.token = raw[++i]; }
    else if (a === '--db') { argv.db = raw[++i]; }
  }
  module.exports._argv = argv;
})();
const argv = module.exports._argv;
const { Pool } = require('pg');
(async function(){
  try{
    const token = argv.token || argv.t;
    const dbUrl = argv.db || process.env.DATABASE_URL;
    if(!token){
      console.error('Missing --token'); process.exit(2);
    }
    if(!dbUrl){
      console.error('Missing DATABASE_URL (pass --db or set env)'); process.exit(2);
    }
    const pool = new Pool({ connectionString: dbUrl });
    const client = await pool.connect();
    try{
      // find session token
      const r = await client.query('select token, user_id, address, created_at from user_session_tokens where token = $1 limit 1', [token]);
      if(!r.rows || r.rows.length===0){
        console.log(JSON.stringify({ authenticated: false, reason: 'token not found' }, null, 2));
        return;
      }
      const row = r.rows[0];
      const userId = row.user_id || null;
      const address = row.address || null;
      // fetch user by id or address
      let user = null;
      if(userId){
        const ru = await client.query('select id, username, address from users where id = $1 limit 1', [userId]);
        user = ru.rows[0] || null;
      }
      if(!user && address){
        const ru = await client.query('select id, username, address from users where lower(address) = lower($1) limit 1', [address]);
        user = ru.rows[0] || null;
      }
      let profile = null;
      if(user){
        const rp = await client.query('select display_name, avatar, xp, level, quests_completed, tasks_completed from user_profiles where user_id = $1 limit 1', [user.id]);
        profile = rp.rows[0] || null;
      }
      const output = {
        authenticated: true,
        token: row.token,
        token_user_id: userId,
        token_address: address,
        user: user || null,
        profile: profile || null
      };
      console.log(JSON.stringify(output, null, 2));
    } finally{
      client.release();
      await pool.end();
    }
  }catch(e){
    console.error('error', e && e.stack || e);
    process.exit(1);
  }
})();
