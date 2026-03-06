import { createClient, getUserId } from "@/lib/supabase/server";
import { getWeekNumber, getWeekYear, getWeekDates, formatDate, DAY_NAMES } from "@/lib/dates";
import WeekClient from "./WeekClient";

interface WeekPageProps {
  searchParams: Promise<{ year?: string; week?: string }>;
}

export default async function WeekPage({ searchParams }: WeekPageProps) {
  const { year: yearParam, week: weekParam } = await searchParams;
  const now = new Date();
  const year = yearParam ? Number(yearParam) : getWeekYear(now);
  const week = weekParam ? Number(weekParam) : getWeekNumber(now);

  const weekDates = getWeekDates(year, week);
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return null;

  // Get template for this week
  const { data: assignment } = await supabase
    .from("week_assignments")
    .select("template_id, week_templates(name)")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("week_number", week)
    .single();

  let templateId = assignment?.template_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weekTemplatesJoin = assignment?.week_templates as any;
  let templateName: string | undefined = Array.isArray(weekTemplatesJoin)
    ? weekTemplatesJoin[0]?.name
    : weekTemplatesJoin?.name;

  if (!templateId) {
    const { data: defaultTemplate } = await supabase
      .from("week_templates")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();
    templateId = defaultTemplate?.id;
    templateName = defaultTemplate?.name;
  }

  // Get template day tasks
  type DayTaskEntry = { task_id: string; tasks: { id: string; name: string; type: string; color: string | null } };
  const dayTasks: Record<number, DayTaskEntry[]> = {};
  if (templateId) {
    const { data } = await supabase
      .from("template_day_tasks")
      .select("day_of_week, task_id, tasks(id, name, type, color)")
      .eq("template_id", templateId)
      .order("sort_order");

    if (data) {
      for (const dt of data) {
        const dayOfWeek = dt.day_of_week as number;
        if (!dayTasks[dayOfWeek]) dayTasks[dayOfWeek] = [];
        // Supabase join returns the related record (singular FK) as an object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tasksJoin = (dt as any).tasks;
        const taskData = Array.isArray(tasksJoin) ? tasksJoin[0] : tasksJoin;
        if (taskData) {
          dayTasks[dayOfWeek].push({ task_id: dt.task_id as string, tasks: taskData });
        }
      }
    }
  }

  // Get all templates for the selector
  const { data: allTemplates } = await supabase
    .from("week_templates")
    .select("id, name, is_default")
    .eq("user_id", userId)
    .order("name");

  // Get completions for the entire week
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);
  const { data: completions } = await supabase
    .from("completions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  return (
    <div>
      <WeekClient
        year={year}
        week={week}
        templateName={templateName}
        weekDates={weekDates.map((d) => formatDate(d))}
        dayNames={DAY_NAMES}
        dayTasks={dayTasks}
        completions={completions || []}
        templates={allTemplates || []}
        currentTemplateId={templateId || null}
        hasExplicitAssignment={!!assignment}
      />
    </div>
  );
}
