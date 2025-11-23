-- Migration: create quests table
CREATE TABLE IF NOT EXISTS quests (
  id varchar PRIMARY KEY,
  title varchar NOT NULL,
  description text,
  xp integer DEFAULT 0,
  reward_text varchar,
  kind varchar,
  url varchar,
  action_label varchar,
  hero_image varchar,
  is_active integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index on is_active for faster queries
CREATE INDEX IF NOT EXISTS idx_quests_is_active ON quests(is_active);
