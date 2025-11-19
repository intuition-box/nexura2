-- Migration: create project_accounts table for Postgres/Neon
-- Run this in psql against your database (Neon or other Postgres-compatible DB).
-- Creates a table to store project-level wallet accounts used for project login

CREATE TABLE IF NOT EXISTS project_accounts (
  id BIGSERIAL PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  chain_id INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional index on address for faster lookups (unique already provides index):
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_accounts_address ON project_accounts(address);

-- Granting minimal access (if you want to use a dedicated role), adjust as needed:
-- GRANT SELECT, INSERT, UPDATE ON project_accounts TO anon;

-- End of migration
