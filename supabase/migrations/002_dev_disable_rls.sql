-- Run this ONLY for development. Re-enable RLS before going to production.
-- This disables RLS so the dev bypass auth can write data without a real user.

ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_qualities DISABLE ROW LEVEL SECURITY;
ALTER TABLE week_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_day_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE week_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quality_completions DISABLE ROW LEVEL SECURITY;
