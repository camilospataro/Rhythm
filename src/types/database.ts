export type TaskType = "checkbox" | "multi_quality";
export type QualityType = "checkbox" | "rating";

export interface Task {
  id: string;
  user_id: string;
  name: string;
  type: TaskType;
  rating_min: number;
  rating_max: number;
  color: string | null;
  icon: string | null;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskQuality {
  id: string;
  task_id: string;
  user_id: string;
  name: string;
  type: QualityType;
  rating_max: number;
  tags: string[];
  sort_order: number;
  created_at: string;
}

export interface WeekTemplate {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateDayTask {
  id: string;
  template_id: string;
  task_id: string;
  user_id: string;
  day_of_week: number;
  sort_order: number;
  deadline_time: string | null;
  window_start: string | null;
  window_end: string | null;
  time_strict: boolean;
}

export interface WeekAssignment {
  id: string;
  user_id: string;
  template_id: string;
  year: number;
  week_number: number;
  created_at: string;
}

export interface DayTask {
  id: string;
  user_id: string;
  task_id: string;
  date: string;
  sort_order: number;
  created_at: string;
}

export interface Completion {
  id: string;
  user_id: string;
  task_id: string;
  date: string;
  completed: boolean | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface QualityCompletion {
  id: string;
  completion_id: string;
  quality_id: string;
  user_id: string;
  completed: boolean | null;
  rating: number | null;
  selected_tags: string[];
}

// Supabase Database type for typed client
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Task, "id">>;
        Relationships: [];
      };
      task_qualities: {
        Row: TaskQuality;
        Insert: Omit<TaskQuality, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<TaskQuality, "id">>;
        Relationships: [];
      };
      week_templates: {
        Row: WeekTemplate;
        Insert: Omit<WeekTemplate, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<WeekTemplate, "id">>;
        Relationships: [];
      };
      template_day_tasks: {
        Row: TemplateDayTask;
        Insert: Omit<TemplateDayTask, "id"> & { id?: string };
        Update: Partial<Omit<TemplateDayTask, "id">>;
        Relationships: [];
      };
      week_assignments: {
        Row: WeekAssignment;
        Insert: Omit<WeekAssignment, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<WeekAssignment, "id">>;
        Relationships: [];
      };
      day_tasks: {
        Row: DayTask;
        Insert: Omit<DayTask, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<DayTask, "id">>;
        Relationships: [];
      };
      completions: {
        Row: Completion;
        Insert: Omit<Completion, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Completion, "id">>;
        Relationships: [];
      };
      quality_completions: {
        Row: QualityCompletion;
        Insert: Omit<QualityCompletion, "id"> & { id?: string };
        Update: Partial<Omit<QualityCompletion, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
