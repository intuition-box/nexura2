-- Campaign Tasks Migration
-- Creates tables for organization-level campaign tasks with multiple verification types

CREATE TABLE IF NOT EXISTS campaign_tasks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_category TEXT NOT NULL CHECK (task_category IN ('discord', 'twitter', 'onchain', 'telegram', 'poh', 'quiz', 'email')),
  task_subtype TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  verification_config TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_task_completions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id VARCHAR NOT NULL REFERENCES campaign_tasks(id) ON DELETE CASCADE,
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  xp_awarded INTEGER NOT NULL,
  verification_data TEXT NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_campaign_id ON campaign_tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_project_id ON campaign_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_campaign_task_completions_user_id ON campaign_task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_task_completions_task_id ON campaign_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_campaign_task_completions_campaign_id ON campaign_task_completions(campaign_id);
