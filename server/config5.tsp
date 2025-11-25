// Central config file: avoid direct use of process.env throughout the codebase.
// Values are intentionally inlined here (per workspace request). Replace values
// below as needed. DO NOT commit secrets to public repositories.

export const CONFIG = {
  // Database
  DATABASE_URL: "postgresql://neondb_owner:npg_g4BOXLHIw9uv@ep-super-dawn-ahjzzy2h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",

  // General
  DEBUG_SESSION_SECRET: "debug123",
  NODE_ENV: "production",
  PORT: 5051,
  HOST: "0.0.0.0",

  // Flags
  SEED_ON_START: false,
  PER_USER_QUEST_TABLES: false,
  PER_USER_TABLES: false,
  PER_PROJECT_TABLES: false,

  // App / frontend URLs
  APP_URL: "",
  VITE_BACKEND_URL: "",

  // S3 / Storage
  S3_BUCKET: "",
  S3_REGION: "",
  S3_PUBLIC_URL: "",

  // Twitter / OAuth
  TWITTER_API_KEY: "",
  TWITTER_API_SECRET: "",

  // Smart contract / blockchain
  LEVEL_BADGE_ADDRESS: "",
  LEVEL_CONTRACT_ADDRESS: "",
  LEVEL_RPC_URL: "",
  INTUITION_TESTNET_RPC: "",
  LEVEL_SERVER_PRIVATE_KEY: "",

  // NFT / storage
  NFT_STORAGE_KEY: "",
  RPC_URL: "",
  CHAIN_ID: "",
  SERVER_PRIVATE_KEY: "",
};

// Convenience named exports for common values
export const {
  DATABASE_URL,
  DEBUG_SESSION_SECRET,
  NODE_ENV,
  PORT,
  HOST,
  SEED_ON_START,
  APP_URL,
  VITE_BACKEND_URL,
} = CONFIG;

export default CONFIG;
