import { broadcast } from "./notifications";
import { ethers } from "ethers";
import { storage } from "./storage";

type MintJob = {
  jobId: string;
  userId: string;
  level: number;
  address: string;
};

const queue: MintJob[] = [];
let running = false;

export function enqueueMint(job: MintJob) {
  queue.push(job);
  processQueue().catch((e) => console.error("mint queue error", e));
}

async function processQueue() {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    await processJob(job).catch((e) => {
      console.error("mint job failed", job.jobId, e);
      broadcast({ type: "mint:error", jobId: job.jobId, error: String(e) });
    });
  }
  running = false;
}

async function uploadMetadataToIpfs(metadata: any): Promise<string> {
  const key = process.env.NFT_STORAGE_KEY;
  if (!key) {
    // fallback - store JSON as a base64 pseudo-CID (for dev only)
    const raw = Buffer.from(JSON.stringify(metadata)).toString("base64");
    return `cid:base64:${raw.slice(0, 80)}`;
  }

  // Use nft.storage simple upload
  const res = await fetch("https://api.nft.storage/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) throw new Error(`IPFS upload failed: ${res.status}`);
  const json = await res.json();
  const cid = json.value?.cid || json.cid;
  if (!cid) throw new Error("no cid returned from nft.storage");
  return `ipfs://${cid}`;
}

async function processJob(job: MintJob) {
  broadcast({ type: "mint:started", jobId: job.jobId, userId: job.userId, level: job.level });

  // idempotency: if an NFT record already exists for this user/level with txHash, skip
  const existing = await storage.getLevelNftRecord(job.userId, job.level);
  if (existing && existing.txHash) {
    broadcast({ type: "mint:skipped", jobId: job.jobId, userId: job.userId, level: job.level, txHash: existing.txHash });
    return;
  }

  // Generate metadata
  const metadata = {
    name: `Nexura Level ${job.level} Badge`,
    description: `Awarded for reaching level ${job.level} in Nexura.`,
    attributes: [{ trait_type: "level", value: job.level }],
    issuance: { date: new Date().toISOString(), userId: job.userId },
  };

  const metadataUri = await uploadMetadataToIpfs(metadata);

  // persist metadata cid in record
  await storage.createOrGetLevelNftRecord({ userId: job.userId, level: job.level, metadataCid: metadataUri, status: "minting", jobId: job.jobId, metadataUri });

  // on-chain mint
  const rpc = process.env.RPC_URL || "https://testnet.rpc.intuition.systems";
  const chainId = Number(process.env.CHAIN_ID || "13579");
  const pk = process.env.SERVER_PRIVATE_KEY;
  const contractAddr = process.env.LEVEL_BADGE_ADDRESS;
  if (!pk || !contractAddr) {
    // Persist as pending - can't do on-chain in dev without env vars
    await storage.createOrGetLevelNftRecord({ userId: job.userId, level: job.level, metadataCid: metadataUri, status: "pending_offchain", jobId: job.jobId, metadataUri });
    broadcast({ type: "mint:pending", jobId: job.jobId, metadataUri, userId: job.userId });
    return;
  }
  // Create provider with provided RPC and chain ID
  const provider = new ethers.JsonRpcProvider(rpc, chainId);
  console.log(`mintWorker: using RPC ${rpc} (chainId=${chainId})`);
  const wallet = new ethers.Wallet(pk, provider);
  // Minimal ABI for mintTo and event
  const abi = [
    "function mintTo(address to, string memory uri) returns (uint256)",
    "event LevelMinted(address indexed to, uint256 indexed tokenId, string uri)"
  ];
  const contract = new ethers.Contract(contractAddr, abi, wallet);

  const tx = await contract.mintTo(job.address, metadataUri);
  const receipt = await tx.wait();

  // try to find event
  let tokenId: any = undefined;
  for (const ev of receipt.logs || []) {
    try {
      const parsed = contract.interface.parseLog(ev);
      if (parsed && parsed.name === "LevelMinted") {
        tokenId = parsed.args?.tokenId?.toString?.() || parsed.args?.tokenId;
        break;
      }
    } catch (e) {
      // ignore
    }
  }

  await storage.createOrGetLevelNftRecord({ userId: job.userId, level: job.level, status: "minted", txHash: receipt.transactionHash, tokenId: tokenId?.toString?.(), metadataUri, jobId: job.jobId });

  broadcast({ type: "mint:completed", jobId: job.jobId, userId: job.userId, level: job.level, txHash: receipt.transactionHash, tokenId });
}

export default { enqueueMint };
