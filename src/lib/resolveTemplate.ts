import { createClient, getUserId } from "@/lib/supabase/server";
import { getWeekNumber, getWeekYear, getDayOfWeek, formatDate } from "@/lib/dates";
import type { Task, TaskQuality, Completion, QualityCompletion } from "@/types/database";

export interface TaskSchedule {
  deadline_time: string | null;
  window_start: string | null;
  window_end: string | null;
  time_strict: boolean;
}

export interface ResolvedTask extends Task {
  qualities: TaskQuality[];
  completion: Completion | null;
  qualityCompletions: QualityCompletion[];
  schedule: TaskSchedule | null;
  isStandalone: boolean;
}

export async function resolveTasksForDate(date: Date): Promise<ResolvedTask[]> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return [];

  const year = getWeekYear(date);
  const week = getWeekNumber(date);
  const dayOfWeek = getDayOfWeek(date);
  const dateStr = formatDate(date);

  // Find which template applies to this week
  const { data: assignment } = await supabase
    .from("week_assignments")
    .select("template_id")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("week_number", week)
    .single();

  let templateId: string | null = assignment?.template_id || null;

  // Fall back to default template
  if (!templateId) {
    const { data: defaultTemplate } = await supabase
      .from("week_templates")
      .select("id")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();
    templateId = defaultTemplate?.id || null;
  }

  // Get template tasks
  let templateResults: ResolvedTask[] = [];
  const templateTaskIds: Set<string> = new Set();

  if (templateId) {
    const { data: dayTasks } = await supabase
      .from("template_day_tasks")
      .select("task_id, sort_order, deadline_time, window_start, window_end, time_strict")
      .eq("template_id", templateId)
      .eq("day_of_week", dayOfWeek)
      .order("sort_order");

    if (dayTasks && dayTasks.length > 0) {
      const taskIds = dayTasks.map((dt) => dt.task_id);
      taskIds.forEach((id) => templateTaskIds.add(id));

      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .in("id", taskIds)
        .eq("archived", false);

      if (tasks && tasks.length > 0) {
        const multiQualityTaskIds = tasks.filter((t) => t.type === "multi_quality").map((t) => t.id);
        let qualities: TaskQuality[] = [];
        if (multiQualityTaskIds.length > 0) {
          const { data: q } = await supabase.from("task_qualities").select("*").in("task_id", multiQualityTaskIds).order("sort_order");
          qualities = q || [];
        }

        const { data: completions } = await supabase.from("completions").select("*").eq("user_id", userId).eq("date", dateStr).in("task_id", taskIds);

        let qualityCompletions: QualityCompletion[] = [];
        if (completions && completions.length > 0) {
          const { data: qc } = await supabase.from("quality_completions").select("*").in("completion_id", completions.map((c) => c.id));
          qualityCompletions = qc || [];
        }

        const taskOrder = new Map(dayTasks.map((dt) => [dt.task_id, dt.sort_order]));
        const taskSchedule = new Map(dayTasks.map((dt) => [dt.task_id, {
          deadline_time: dt.deadline_time ?? null,
          window_start: dt.window_start ?? null,
          window_end: dt.window_end ?? null,
          time_strict: dt.time_strict ?? false,
        }]));

        templateResults = tasks
          .sort((a, b) => (taskOrder.get(a.id) || 0) - (taskOrder.get(b.id) || 0))
          .map((task) => ({
            ...task,
            qualities: qualities.filter((q) => q.task_id === task.id),
            completion: completions?.find((c) => c.task_id === task.id) || null,
            qualityCompletions: qualityCompletions.filter((qc) =>
              qualities.some((q) => q.task_id === task.id && q.id === qc.quality_id)
            ),
            schedule: taskSchedule.get(task.id) || null,
            isStandalone: false,
          }));
      }
    }
  }

  // Get standalone day tasks
  const { data: standaloneDayTasks } = await supabase
    .from("day_tasks")
    .select("task_id, sort_order")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .order("sort_order");

  let standaloneResults: ResolvedTask[] = [];

  if (standaloneDayTasks && standaloneDayTasks.length > 0) {
    // Exclude tasks already from template
    const standaloneIds = standaloneDayTasks
      .map((dt) => dt.task_id)
      .filter((id) => !templateTaskIds.has(id));

    if (standaloneIds.length > 0) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .in("id", standaloneIds)
        .eq("archived", false);

      if (tasks && tasks.length > 0) {
        const multiQualityTaskIds = tasks.filter((t) => t.type === "multi_quality").map((t) => t.id);
        let qualities: TaskQuality[] = [];
        if (multiQualityTaskIds.length > 0) {
          const { data: q } = await supabase.from("task_qualities").select("*").in("task_id", multiQualityTaskIds).order("sort_order");
          qualities = q || [];
        }

        const { data: completions } = await supabase.from("completions").select("*").eq("user_id", userId).eq("date", dateStr).in("task_id", standaloneIds);

        let qualityCompletions: QualityCompletion[] = [];
        if (completions && completions.length > 0) {
          const { data: qc } = await supabase.from("quality_completions").select("*").in("completion_id", completions.map((c) => c.id));
          qualityCompletions = qc || [];
        }

        const orderMap = new Map(standaloneDayTasks.map((dt) => [dt.task_id, dt.sort_order]));

        standaloneResults = tasks
          .sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0))
          .map((task) => ({
            ...task,
            qualities: qualities.filter((q) => q.task_id === task.id),
            completion: completions?.find((c) => c.task_id === task.id) || null,
            qualityCompletions: qualityCompletions.filter((qc) =>
              qualities.some((q) => q.task_id === task.id && q.id === qc.quality_id)
            ),
            schedule: null,
            isStandalone: true,
          }));
      }
    }
  }

  return [...templateResults, ...standaloneResults];
}
