// Test Twitter request_token sending oauth_callback only in Authorization header (no POST body)
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const oauth1 = require('oauth-1.0a');
const crypto = require('crypto');
const fetch = require('node-fetch');

async function run() {
  const key = (process.env.TWITTER_API_KEY || '').trim();
  const secret = (process.env.TWITTER_API_SECRET || '').trim();
  const callback = (process.env.TWITTER_CALLBACK_URL || 'oob').trim();
  if (!key || !secret) {
    console.error('TWITTER_API_KEY / TWITTER_API_SECRET not set in .env.local');
    process.exit(2);
  }

  const client = oauth1({ consumer: { key, secret }, signature_method: 'HMAC-SHA1', hash_function(base_string, key) { return crypto.createHmac('sha1', key).update(base_string).digest('base64'); } });
  const request_data = { url: 'https://api.twitter.com/oauth/request_token', method: 'POST', data: { oauth_callback: callback } };
  try {
    const headers = client.toHeader(client.authorize(request_data));
    const auth = headers.Authorization || headers.authorization || '';
    const maskedAuth = auth.replace(/oauth_consumer_key="([^"]+)"/, 'oauth_consumer_key="[REDACTED]"').replace(/oauth_signature="([^"]+)"/, 'oauth_signature="[REDACTED]"');
    console.log('Authorization header (masked):', maskedAuth);

    // Send no body (some servers expect oauth_callback only in header)
    const res = await fetch(request_data.url, { method: 'POST', headers: { ...headers } });
    const txt = await res.text();
    if (!res.ok) {
      console.error('Twitter request_token failed:', res.status, txt);
      process.exit(1);
    }
    const params = new URLSearchParams(txt);
    const token = params.get('oauth_token');
    const secretResp = params.get('oauth_token_secret');
    if (token && secretResp) {
      const masked = token.slice(0,6) + '...' + token.slice(-6);
      console.log('request_token succeeded. oauth_token (masked):', masked);
      process.exit(0);
    }
    console.error('unexpected response:', txt);
    process.exit(1);
  } catch (e) {
    console.error('request failed', e);
    process.exit(1);
  }
}

run();
