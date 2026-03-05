-- Add time constraints to template day tasks (per task per day-of-week)
ALTER TABLE template_day_tasks
  ADD COLUMN IF NOT EXISTS deadline_time text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS window_start text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS window_end text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS time_strict boolean DEFAULT false;
