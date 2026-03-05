-- Add type and rating_max columns to task_qualities
ALTER TABLE task_qualities
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'checkbox',
  ADD COLUMN IF NOT EXISTS rating_max integer NOT NULL DEFAULT 5;

-- Add completed column and make rating nullable on quality_completions
ALTER TABLE quality_completions
  ADD COLUMN IF NOT EXISTS completed boolean,
  ALTER COLUMN rating SET DEFAULT 0,
  ALTER COLUMN rating DROP NOT NULL;

-- Update task type constraint to remove 'rating' (only checkbox and multi_quality now)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type IN ('checkbox', 'multi_quality'));
