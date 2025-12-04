-- Migration: create quest_completions table
-- Adds a table to store per-user quest completions and awarded XP.

CREATE TABLE IF NOT EXISTS quest_completions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id),
  quest_id varchar NOT NULL REFERENCES quests(id),
  xp_awarded integer NOT NULL,
  metadata text DEFAULT '{}'::text,
  completed_at timestamp NOT NULL DEFAULT now()
);

-- Prevent duplicate claims for the same user and quest
CREATE UNIQUE INDEX IF NOT EXISTS ux_quest_completions_user_quest ON quest_completions(user_id, quest_id);
