// legacy bearer flow test (removed)
// This file was intentionally removed as the bearer-token auth flow is deprecated.
export {};
import { Wallet } from 'ethers';

async function main() {
  const BASE = process.env.BACKEND_URL || 'http://localhost:5051';
  const PRIVATE_KEY = process.env.TEST_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f094538b2f6d3c0b1b4f2a6c6b6f3d6bff8f8e8c';
  const wallet = new Wallet(PRIVATE_KEY);
  const address = wallet.address;
  console.log('Using test wallet', address);

  const chRes = await fetch(`${BASE}/challenge?address=${address}`);
  const chJson = await chRes.json();
  const message = chJson?.message;
  console.log('Got challenge:', message);

  const signature = await wallet.signMessage(message);
  console.log('Signature', signature.slice(0, 20) + '...');

  const res = await fetch(`${BASE}/auth/wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, message }),
  });
  console.log('/auth/wallet status', res.status);
  const json = await res.json().catch(() => null);
  console.log('/auth/wallet response', JSON.stringify(json, null, 2));
  const token = json?.accessToken;
  if (!token) return;

  const meRes = await fetch(`${BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
  console.log('/api/me with bearer status', meRes.status);
  const meJson = await meRes.json().catch(() => null);
  console.log('/api/me with bearer response', JSON.stringify(meJson, null, 2));
}

main().catch(e=>{ console.error(e); process.exitCode=1; });