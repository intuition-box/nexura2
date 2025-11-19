-- Migration: add avatar and tasks_completed fields to user_profiles
-- This adds the avatar field for profile pictures and tasks_completed for tracking

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS tasks_completed INTEGER NOT NULL DEFAULT 0;

-- End of migration
