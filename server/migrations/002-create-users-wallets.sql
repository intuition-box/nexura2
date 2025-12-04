-- Migration: create users and wallets tables for Postgres/Neon
-- Run this in psql against your database (Neon or other Postgres-compatible DB).
-- This creates `users` (uuid primary key) and `wallets` tables used by the frontend upsert flows.

-- Ensure pgcrypto is available for gen_random_uuid (Supabase has this enabled by default).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table: stores high-level user records associated with wallet addresses.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL UNIQUE,
  username TEXT,
  email TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_address ON users(address);

-- Wallets table: stores low-level wallet records and signatures/meta for verification
CREATE TABLE IF NOT EXISTS wallets (
  id BIGSERIAL PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  chain_id INTEGER,
  provider TEXT,
  label TEXT,
  metadata JSONB,
  signature TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);

-- Note:
-- - The frontend previously used Supabase `upsert` on `users` and `wallets`. The tables and unique constraints below support upsert-style operations using Postgres/Drizzle/Neon as well.
-- - For secure sign-in, your backend should verify signatures (recover address from signature and message) and then create or return an access token. The migrations here only ensure the tables exist for persistence.

-- End of migration

-- User profiles table: stores XP, level, quests completed and other profile metadata
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  quests_completed INTEGER NOT NULL DEFAULT 0,
  social_profiles JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- End of migration additions
