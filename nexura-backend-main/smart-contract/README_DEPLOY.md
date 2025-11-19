Deploy & Grant MINTER_ROLE (Intuition testnet)

Prerequisites
- Node >= 18
- Install dependencies in the smart-contract folder:
  cd nexura-backend-main/smart-contract
  npm install

1) Compile
  npx hardhat compile

2) Deploy (Hardhat)
Set these env vars and run the deploy script via hardhat:

  $env:CONTRACT_NAME = "Nexura Level Badge"
  $env:CONTRACT_SYMBOL = "NXLV"
  $env:DEPLOYER_PRIVATE_KEY = "<your deployer private key>"
  $env:RPC_URL = "https://testnet.rpc.intuition.systems"
  $env:CHAIN_ID = "13579"

Then run (PowerShell):
  npx hardhat run --network sepolia scripts/deploy-levelbadge.ts

Note: the above uses the `sepolia` network entry in `hardhat.config.ts`. Alternatively configure a `intuition` network in `hardhat.config.ts` and run with `--network intuition`.

When deployed, note the deployed address in the script output. Set it to LEVEL_BADGE_ADDRESS for the next step.

3) Grant MINTER_ROLE to the server signer
Set these env vars:
  $env:DEPLOYER_PRIVATE_KEY = "<deployer key that has admin role on contract>"
  $env:SERVER_MINTER_ADDRESS = "<server signer public address>"
  $env:LEVEL_BADGE_ADDRESS = "<deployed contract address>"
  $env:RPC_URL = "https://testnet.rpc.intuition.systems"
  $env:CHAIN_ID = "13579"

Then run the grant script (from this folder):
  # If you have ts-node installed
  npx ts-node scripts/grant-minter.ts

Or run with node after building/transpiling.

Server configuration
- Set the following env vars on your server (or locally) so the worker can mint:
  LEVEL_BADGE_ADDRESS
  SERVER_PRIVATE_KEY (server signer with MINTER_ROLE)
  RPC_URL and CHAIN_ID (optional; defaults are set to Intuition testnet)
  NFT_STORAGE_KEY (optional for IPFS uploads)

Security
- Keep private keys in a secure store (Vault, environment secrets). Do NOT commit private keys to source control.
