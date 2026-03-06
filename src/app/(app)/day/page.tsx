import { resolveTasksForDate } from "@/lib/resolveTemplate";
import { formatDate, formatDisplayDate } from "@/lib/dates";
import { createClient, getUserId } from "@/lib/supabase/server";
import DayClient from "./DayClient";
import { getAdminInfo } from "@/lib/admin";

interface DayPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DayPage({ searchParams }: DayPageProps) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  const dateStr = formatDate(date);
  const displayDate = formatDisplayDate(date);

  const [tasks, adminInfo, { supabase, userId }] = await Promise.all([
    resolveTasksForDate(date),
    getAdminInfo(),
    (async () => {
      const supabase = await createClient();
      const userId = await getUserId();
      return { supabase, userId };
    })(),
  ]);

  // Fetch all non-archived tasks for the task picker
  const { data: allTasksData } = userId
    ? await supabase
        .from("tasks")
        .select("id, name, type, color")
        .eq("user_id", userId)
        .eq("archived", false)
        .order("name")
    : { data: null };

  const completedCount = tasks.filter((t) => {
    if (t.type === "checkbox") return t.completion?.completed;
    if (t.type === "multi_quality") {
      const mainDone = t.rating_max > 0
        ? t.completion?.rating != null
        : t.completion?.completed ?? false;
      const subsDone = t.qualities.length === 0 || t.qualityCompletions.filter((qc) => {
        const q = t.qualities.find((qual) => qual.id === qc.quality_id);
        if (!q) return false;
        return q.type === "checkbox" ? qc.completed : qc.rating != null;
      }).length === t.qualities.length;
      return mainDone && subsDone;
    }
    return false;
  }).length;

  return (
    <DayClient
      tasks={tasks}
      date={dateStr}
      displayDate={displayDate}
      completedCount={completedCount}
      allTasks={allTasksData || []}
      isAdmin={!!adminInfo}
      impersonatingEmail={adminInfo?.impersonatingEmail}
    />
  );
}
