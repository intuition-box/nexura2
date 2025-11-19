-- Migration: create user_level_nfts table

CREATE TABLE IF NOT EXISTS user_level_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  token_id TEXT,
  tx_hash TEXT,
  metadata_uri TEXT,
  metadata_cid TEXT,
  status TEXT,
  job_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_level_unique ON user_level_nfts(user_id, level);
