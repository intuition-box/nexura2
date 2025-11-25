#!/usr/bin/env node
const { Wallet } = require('ethers');

async function run() {
  try {
    const argv = {};
    const raw = process.argv.slice(2);
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i];
      if (a === '--url') argv.url = raw[++i];
      else if (a === '--privateKey') argv.privateKey = raw[++i];
    }
    const TARGET = argv.url || process.env.TARGET_URL || 'http://localhost:5051';
    const priv = argv.privateKey || process.env.TEST_PRIVATE_KEY;
    if (!priv) throw new Error('privateKey required via --privateKey or TEST_PRIVATE_KEY env var');

    const wallet = new Wallet(priv);
    const address = await wallet.getAddress();
    console.log('Using address', address);

    const challengeUrl = `${TARGET.replace(/\/+$/,'')}/challenge?address=${encodeURIComponent(address)}`;
    const chRes = await fetch(challengeUrl);
    if (!chRes.ok) throw new Error('challenge request failed: ' + chRes.status + ' ' + (await chRes.text()));
    const chJson = await chRes.json();
    const message = chJson.message;
    console.log('Received challenge:', message);

    const signature = await wallet.signMessage(message);
    console.log('Signature length', signature.length);

    const authRes = await fetch(`${TARGET.replace(/\/+$/,'')}/auth/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature, message })
    });
    const authJson = await authRes.json().catch(() => null);
    console.log('/auth/wallet HTTP', authRes.status, authJson);
    if (!authRes.ok) throw new Error('/auth/wallet failed');

    const token = authJson && authJson.accessToken;
    if (!token) {
      console.warn('No accessToken received');
    } else {
      console.log('Received accessToken (first 8 chars):', token.slice(0, 8));
    }

    const meRes = await fetch(`${TARGET.replace(/\/+$/,'')}/api/me`, {
      method: 'GET',
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    });
    const meJson = await meRes.json().catch(() => null);
    console.log('/api/me HTTP', meRes.status, meJson);

    return 0;
  } catch (err) {
    console.error('E2E test failed:', String(err));
    return 1;
  }
}

run().then(process.exit);
