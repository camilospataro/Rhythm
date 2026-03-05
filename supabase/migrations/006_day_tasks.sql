-- Standalone day tasks (manual tasks added to specific dates, independent of templates)
CREATE TABLE day_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date date NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, task_id, date)
);
