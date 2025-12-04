-- Migration: create user_quest_completions table to track completed quests
-- This prevents users from claiming the same quest multiple times

CREATE TABLE IF NOT EXISTS user_quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_quest_completions_user ON user_quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_completions_quest ON user_quest_completions(quest_id);

-- End of migration
