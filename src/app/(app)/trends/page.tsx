import { createClient, getUserId } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import TrendsClient from "./TrendsClient";
import type { Task, Completion, TaskQuality, QualityCompletion } from "@/types/database";

export default async function TrendsPage() {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("name");

  const taskIds = (tasks || []).map((t) => t.id);

  // Get last 90 days of completions
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const startDate = ninetyDaysAgo.toISOString().split("T")[0];

  const { data: completions } = await supabase
    .from("completions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .order("date");

  // Fetch task qualities for all tasks
  const { data: taskQualities } = taskIds.length > 0
    ? await supabase
        .from("task_qualities")
        .select("*")
        .in("task_id", taskIds)
        .order("sort_order")
    : { data: [] };

  // Fetch quality completions for the 90-day window
  const completionIds = (completions || []).map((c) => c.id);
  const { data: qualityCompletions } = completionIds.length > 0
    ? await supabase
        .from("quality_completions")
        .select("*")
        .in("completion_id", completionIds)
    : { data: [] };

  return (
    <div>
      <Header title="Trends" subtitle="Track your progress over time" />
      <TrendsClient
        tasks={(tasks as Task[]) || []}
        completions={(completions as Completion[]) || []}
        taskQualities={(taskQualities as TaskQuality[]) || []}
        qualityCompletions={(qualityCompletions as QualityCompletion[]) || []}
      />
    </div>
  );
}
