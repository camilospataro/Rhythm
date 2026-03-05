-- Add predefined tags to qualities and selected tags to completions
ALTER TABLE task_qualities ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE quality_completions ADD COLUMN IF NOT EXISTS selected_tags text[] DEFAULT '{}';
