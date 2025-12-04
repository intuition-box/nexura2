#!/usr/bin/env node
// simulate_appkit_login_and_capture_console.cjs
// Simulate AppKit wallet login flow against a remote site and capture browser console logs
// Usage: node scripts/simulate_appkit_login_and_capture_console.cjs --url https://example.com --privateKey <hex>

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const { Wallet } = require('ethers');

(async function(){
  try{
    const argv = {};
    const raw = process.argv.slice(2);
    for(let i=0;i<raw.length;i++){
      const a = raw[i];
      if(a==='--url') argv.url = raw[++i];
      else if(a==='--privateKey') argv.privateKey = raw[++i];
      else if(a==='--out') argv.out = raw[++i];
    }
    const TARGET = argv.url || process.env.TARGET_URL || 'https://nexura2-main.onrender.com';
    const OUT = argv.out || path.resolve(process.cwd(),'server','data','browser_console.log');
    const priv = argv.privateKey || process.env.TEST_PRIVATE_KEY || '0x59c6995e998f97a5a004497e5f9b3b1a8b2b40a0d3f2f4b5d3f9d6e3a6f9f7d3';

    if(!TARGET) throw new Error('target url required --url');

    // create wallet
    const wallet = new Wallet(priv);
    const address = await wallet.getAddress();
    console.log('Using address', address);

    // 1) Fetch challenge
    const challengeUrl = new URL('/challenge', TARGET).toString();
    console.log('Requesting challenge from', challengeUrl);
    const chRes = await fetch(challengeUrl + '?address=' + encodeURIComponent(address));
    if(!chRes.ok) throw new Error('challenge request failed: ' + chRes.status + ' ' + (await chRes.text()));
    const chJson = await chRes.json();
    const message = chJson.message;
    console.log('Received challenge message:', message);

    // 2) Sign message
    const signature = await wallet.signMessage(message);
    console.log('Signed message, signature length', signature.length);

    // 3) POST /auth/wallet
    const authUrl = new URL('/auth/wallet', TARGET).toString();
    console.log('Posting to', authUrl);
    const authRes = await fetch(authUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, signature, message }) });
    const authJson = await authRes.json().catch(()=>null);
    if(!authRes.ok) {
      throw new Error('/auth/wallet failed: ' + authRes.status + ' ' + JSON.stringify(authJson));
    }
    console.log('Auth result', authJson);
    const token = authJson && authJson.accessToken ? authJson.accessToken : null;
    if(!token) {
      console.warn('No accessToken returned; continuing but requests may be unauthenticated');
    }

    // 4) Launch Puppeteer and navigate with Authorization header added to API calls
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // capture console messages
    const logs = [];
    page.on('console', msg => {
      try{
        const text = msg.text();
        const entry = { type: msg.type(), text, location: msg.location ? msg.location() : null, timestamp: new Date().toISOString() };
        logs.push(entry);
        console.log('[BROWSER]', entry.type, entry.text);
      }catch(e){ console.warn('console handler error', e); }
    });

    // capture page errors
    page.on('pageerror', err => {
      const entry = { type: 'pageerror', text: err.stack || String(err), timestamp: new Date().toISOString() };
      logs.push(entry);
      console.error('[BROWSER PAGE ERROR]', entry.text);
    });

    // intercept requests to inject Authorization header for API calls
    await page.setRequestInterception(true);
    page.on('request', req => {
      const url = req.url();
      const isApi = url.startsWith(TARGET) && /\/api\//.test(url) || url.startsWith(TARGET) && /auth|challenge/.test(url);
      const headers = Object.assign({}, req.headers());
      if(token && isApi) {
        headers['authorization'] = 'Bearer ' + token;
      }
      req.continue({ headers });
    });

    // navigate
    console.log('Navigating to', TARGET);
    await page.goto(TARGET, { waitUntil: 'networkidle2', timeout: 60000 }).catch(e => { console.warn('goto failed', e && e.message); });

    // wait some time to let client do API calls (polyfill for puppeteer versions without waitForTimeout)
    await new Promise((r) => setTimeout(r, 4000));

    // fetch /api/me via page context to observe any console logs and response
    try{
      const me = await page.evaluate(async () => {
        try{
          const r = await fetch('/api/me', { credentials: 'include' });
          const j = await r.json().catch(()=>null);
          console.log('fetch /api/me status', r.status, j);
          return { status: r.status, body: j };
        }catch(e){ console.error('fetch /api/me error', e); return { error: String(e) }; }
      });
      logs.push({ type: 'fetch:/api/me', text: JSON.stringify(me), timestamp: new Date().toISOString() });
      console.log('/api/me via page', me);
    }catch(e){ console.warn('evaluate fetch /api/me failed', e && e.message); }

    // write logs to OUT and cleanup in finally-like behavior
    const outDir = path.dirname(OUT);
    if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(logs, null, 2), 'utf8');
    console.log('Wrote browser console log to', OUT);

    await browser.close();
    console.log('Done.');
  }catch(e){
    try{
      // attempt to persist any collected logs
      const OUT = path.resolve(process.cwd(),'server','data','browser_console.log');
      const outDir = path.dirname(OUT);
      if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.appendFileSync(OUT, '\n// script error:\n' + (e && (e.stack || e)) + '\n', 'utf8');
      console.error('simulate script failed, logs appended to', OUT, e && e.stack || e);
    }catch(writeErr){
      console.error('failed to write logs after error', writeErr);
    }
    process.exit(1);
  }
})();
