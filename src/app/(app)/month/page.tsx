import { createClient, getUserId } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import MonthClient from "./MonthClient";
import { getWeekNumber, getWeekYear } from "@/lib/dates";
import { startOfMonth, endOfMonth, startOfWeek, addDays, format } from "date-fns";

interface MonthPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function MonthPage({ searchParams }: MonthPageProps) {
  const { year: yearParam, month: monthParam } = await searchParams;
  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const month = monthParam ? Number(monthParam) : now.getMonth() + 1;

  const date = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const monthName = format(date, "MMMM yyyy");

  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return null;

  // Get all completions for the month
  const { data: completions } = await supabase
    .from("completions")
    .select("date, completed, rating, task_id")
    .eq("user_id", userId)
    .gte("date", format(monthStart, "yyyy-MM-dd"))
    .lte("date", format(monthEnd, "yyyy-MM-dd"));

  // Get all tasks to know total possible per day
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, type")
    .eq("user_id", userId)
    .eq("archived", false);

  // Build daily completion summary
  const dailySummary: Record<string, { completed: number; total: number }> = {};

  if (completions && tasks) {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    for (const c of completions) {
      if (!dailySummary[c.date]) {
        dailySummary[c.date] = { completed: 0, total: 0 };
      }
      dailySummary[c.date].total++;

      const task = taskMap.get(c.task_id);
      if (task) {
        if (task.type === "checkbox" && c.completed) {
          dailySummary[c.date].completed++;
        } else if (task.type === "multi_quality") {
          if (c.completed || c.rating != null) {
            dailySummary[c.date].completed++;
          }
        }
      }
    }
  }

  // Compute ISO weeks that overlap with this month
  let cursor = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weeksInMonth: Array<{
    year: number;
    weekNumber: number;
    startDate: string;
    endDate: string;
  }> = [];
  while (cursor <= monthEnd) {
    const wy = getWeekYear(cursor);
    const wn = getWeekNumber(cursor);
    const ws = format(cursor, "MMM d");
    const we = format(addDays(cursor, 6), "MMM d");
    weeksInMonth.push({ year: wy, weekNumber: wn, startDate: ws, endDate: we });
    cursor = addDays(cursor, 7);
  }

  // Fetch week assignments for these weeks
  const weekKeys = weeksInMonth.map((w) => ({ year: w.year, week_number: w.weekNumber }));
  const { data: assignments } = await supabase
    .from("week_assignments")
    .select("year, week_number, template_id")
    .eq("user_id", userId)
    .in("year", [...new Set(weekKeys.map((k) => k.year))])
    .in("week_number", [...new Set(weekKeys.map((k) => k.week_number))]);

  const assignmentMap = new Map(
    (assignments || []).map((a) => [`${a.year}-${a.week_number}`, a.template_id])
  );

  // Fetch all templates
  const { data: allTemplates } = await supabase
    .from("week_templates")
    .select("id, name, is_default")
    .eq("user_id", userId)
    .order("name");

  const defaultTemplate = (allTemplates || []).find((t) => t.is_default);

  const weekInfos = weeksInMonth.map((w) => {
    const key = `${w.year}-${w.weekNumber}`;
    const assignedId = assignmentMap.get(key) || null;
    return {
      ...w,
      assignedTemplateId: assignedId || defaultTemplate?.id || null,
      isExplicit: !!assignedId,
    };
  });

  return (
    <div>
      <Header title={monthName} />
      <MonthClient
        year={year}
        month={month}
        dailySummary={dailySummary}
        templates={allTemplates || []}
        weekInfos={weekInfos}
      />
    </div>
  );
}
