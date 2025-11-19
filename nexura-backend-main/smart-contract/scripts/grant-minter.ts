// @ts-nocheck
// Usage: set DEPLOYER_PRIVATE_KEY, SERVER_MINTER_ADDRESS, RPC_URL, CHAIN_ID, LEVEL_BADGE_ADDRESS
// Then run: node --loader ts-node/esm scripts/grant-minter.ts OR npx ts-node scripts/grant-minter.ts

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  const serverMinter = process.env.SERVER_MINTER_ADDRESS;
  const rpc = process.env.RPC_URL || 'https://testnet.rpc.intuition.systems';
  const chainId = Number(process.env.CHAIN_ID || '13579');
  const contractAddr = process.env.LEVEL_BADGE_ADDRESS;

  if (!deployerKey) throw new Error('DEPLOYER_PRIVATE_KEY is required');
  if (!serverMinter) throw new Error('SERVER_MINTER_ADDRESS is required');
  if (!contractAddr) throw new Error('LEVEL_BADGE_ADDRESS is required');

  const artifactPath = path.resolve(__dirname, '..', 'artifacts', 'contracts', 'LevelBadge.sol', 'LevelBadge.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('Contract artifact not found. Run `npx hardhat compile` in this folder first.');
    process.exit(1);
  }

  const raw = fs.readFileSync(artifactPath, 'utf8');
  const json = JSON.parse(raw);
  const abi = json.abi;

  const provider = new ethers.JsonRpcProvider(rpc, chainId);
  const wallet = new ethers.Wallet(deployerKey, provider);
  console.log('Granting MINTER_ROLE using deployer', wallet.address, 'to', serverMinter);

  const contract = new ethers.Contract(contractAddr, abi, wallet);
  const role = ethers.id('MINTER_ROLE');
  const tx = await contract.grantRole(role, serverMinter);
  console.log('tx submitted', tx.hash);
  const receipt = await tx.wait();
  console.log('tx mined', receipt.transactionHash);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
