"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTemplate(name: string, isDefault: boolean = false) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  if (isDefault) {
    await supabase
      .from("week_templates")
      .update({ is_default: false })
      .eq("user_id", userId);
  }

  const { data: template, error } = await supabase
    .from("week_templates")
    .insert({
      user_id: userId,
      name,
      is_default: isDefault,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  return template;
}

export async function updateTemplate(
  templateId: string,
  data: { name?: string; is_default?: boolean }
) {
  const supabase = await createClient();

  if (data.is_default) {
    const userId = await getUserId();
    if (!userId) throw new Error("Not authenticated");
    await supabase
      .from("week_templates")
      .update({ is_default: false })
      .eq("user_id", userId);
  }

  const { error } = await supabase
    .from("week_templates")
    .update(data)
    .eq("id", templateId);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("week_templates")
    .delete()
    .eq("id", templateId);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export interface TaskDayConfig {
  taskId: string;
  deadline_time?: string | null;
  window_start?: string | null;
  window_end?: string | null;
  time_strict?: boolean;
}

export async function setTemplateDayTasks(
  templateId: string,
  dayOfWeek: number,
  taskConfigs: TaskDayConfig[]
) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  await supabase
    .from("template_day_tasks")
    .delete()
    .eq("template_id", templateId)
    .eq("day_of_week", dayOfWeek);

  if (taskConfigs.length > 0) {
    const { error } = await supabase.from("template_day_tasks").insert(
      taskConfigs.map((config, index) => ({
        template_id: templateId,
        task_id: config.taskId,
        user_id: userId,
        day_of_week: dayOfWeek,
        sort_order: index,
        deadline_time: config.deadline_time || null,
        window_start: config.window_start || null,
        window_end: config.window_end || null,
        time_strict: config.time_strict ?? false,
      }))
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/tasks");
  revalidatePath("/day");
}

export async function assignWeek(
  year: number,
  weekNumber: number,
  templateId: string
) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("week_assignments")
    .upsert(
      {
        user_id: userId,
        year,
        week_number: weekNumber,
        template_id: templateId,
      },
      { onConflict: "user_id,year,week_number" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/week");
  revalidatePath("/day");
  revalidatePath("/month");
}

export async function unassignWeek(year: number, weekNumber: number) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("week_assignments")
    .delete()
    .eq("user_id", userId)
    .eq("year", year)
    .eq("week_number", weekNumber);

  if (error) throw new Error(error.message);
  revalidatePath("/week");
  revalidatePath("/day");
  revalidatePath("/month");
}
