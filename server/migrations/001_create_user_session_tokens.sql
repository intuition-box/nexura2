-- Create user_session_tokens table for DB-persisted bearer tokens
CREATE TABLE IF NOT EXISTS user_session_tokens (
  token VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128),
  address VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
