-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  quest_increment INTEGER DEFAULT 0 NOT NULL,
  task_increment INTEGER DEFAULT 0 NOT NULL,
  metadata TEXT DEFAULT '{}' NOT NULL,
  is_active INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP
);

-- Create task completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  task_id VARCHAR NOT NULL REFERENCES tasks(id),
  xp_awarded INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_task UNIQUE(user_id, task_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active);
