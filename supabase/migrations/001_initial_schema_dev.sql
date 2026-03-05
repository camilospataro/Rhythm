-- DEV version: no auth.users foreign keys so dev bypass user works
-- For production, use 001_initial_schema.sql instead

-- Tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('checkbox', 'rating', 'multi_quality')),
  rating_min smallint DEFAULT 1,
  rating_max smallint DEFAULT 5,
  color text,
  icon text,
  sort_order integer DEFAULT 0,
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task sub-qualities
CREATE TABLE task_qualities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Week templates
CREATE TABLE week_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Template day-task assignments
CREATE TABLE template_day_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES week_templates(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  sort_order integer DEFAULT 0,
  UNIQUE (template_id, task_id, day_of_week)
);

-- Week assignments (real calendar weeks to templates)
CREATE TABLE week_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES week_templates(id) ON DELETE SET NULL,
  year smallint NOT NULL,
  week_number smallint NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, year, week_number)
);

-- Completions (daily check-ins)
CREATE TABLE completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date date NOT NULL,
  completed boolean,
  rating smallint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, task_id, date)
);

-- Quality completions (sub-quality ratings)
CREATE TABLE quality_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id uuid NOT NULL REFERENCES completions(id) ON DELETE CASCADE,
  quality_id uuid NOT NULL REFERENCES task_qualities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating smallint NOT NULL,
  UNIQUE (completion_id, quality_id)
);

-- Indexes
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_completions_user_date ON completions(user_id, date);
CREATE INDEX idx_completions_task_date ON completions(task_id, date);
CREATE INDEX idx_template_day_tasks_template ON template_day_tasks(template_id, day_of_week);
CREATE INDEX idx_week_assignments_user_week ON week_assignments(user_id, year, week_number);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER week_templates_updated_at BEFORE UPDATE ON week_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER completions_updated_at BEFORE UPDATE ON completions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
