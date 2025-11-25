import { Wallet } from 'ethers';

async function main() {
  const BASE = process.env.BACKEND_URL || 'http://localhost:5051';

  // deterministic private key for testing (DO NOT use in production)
  const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f094538b2f6d3c0b1b4f2a6c6b6f3d6bff8f8e8c';
  const wallet = new Wallet(PRIVATE_KEY);
  const address = wallet.address;
  console.log('Using test wallet', address);

  // request challenge
  console.log('Requesting challenge...');
  const chRes = await fetch(`${BASE}/challenge?address=${address}`);
  if (!chRes.ok) {
    console.error('challenge request failed', await chRes.text());
    process.exitCode = 2; return;
  }
  const chJson = await chRes.json();
  const message = chJson?.message || `Nexura Wallet Login\nAddress: ${address}\nNonce: test`;
  console.log('Challenge message:', message);

  // sign
  const signature = await wallet.signMessage(message);
  console.log('Signature:', signature.slice(0,20) + '...');

  // call /auth/simple
  console.log('Posting to /auth/simple...');
  const res = await fetch(`${BASE}/auth/simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, message }),
  });

  console.log('Status', res.status);
  const json = await res.json().catch(() => null);
  console.log('Response:', JSON.stringify(json, null, 2));

  // Now test /api/me using x-wallet-address header
  console.log('Calling /api/me with x-wallet-address header...');
  const meRes = await fetch(`${BASE}/api/me`, { headers: { 'x-wallet-address': address } });
  console.log('/api/me status', meRes.status);
  const meJson = await meRes.json().catch(() => null);
  console.log('/api/me response:', JSON.stringify(meJson, null, 2));
}

main().catch(e=>{ console.error(e); process.exitCode=1; });
