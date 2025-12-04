-- Migration: create user_oauth_tokens table
-- Creates a table to store provider oauth tokens for users (used for Neon/Postgres storage)

CREATE TABLE IF NOT EXISTS user_oauth_tokens (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure a single provider record per user
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_provider ON user_oauth_tokens (user_id, provider);

-- Optional foreign key if users.id is text and present
-- ALTER TABLE user_oauth_tokens ADD CONSTRAINT fk_user_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
