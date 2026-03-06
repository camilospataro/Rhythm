"use server";

import { createClient, getUserId } from "@/lib/supabase/server";

/**
 * Seeds a new account with an example task and default template.
 * Only runs if the user has zero tasks (i.e. brand new account).
 */
export async function seedNewAccount() {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return;

  // Check if user already has tasks — skip if not a fresh account
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count && count > 0) return;

  // 1. Create the example task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      name: "Send love to Cami",
      type: "checkbox",
      color: "#f472b6", // pink
      rating_min: 0,
      rating_max: 0,
      sort_order: 0,
      archived: false,
    })
    .select()
    .single();

  if (taskError || !task) return;

  // 2. Create a default template
  const { data: template, error: templateError } = await supabase
    .from("week_templates")
    .insert({
      user_id: userId,
      name: "My Week",
      is_default: true,
    })
    .select()
    .single();

  if (templateError || !template) return;

  // 3. Assign the task to all 7 days (0=Mon through 6=Sun)
  const dayInserts = Array.from({ length: 7 }, (_, day) => ({
    template_id: template.id,
    task_id: task.id,
    user_id: userId,
    day_of_week: day,
    sort_order: 0,
    time_strict: false,
  }));

  await supabase.from("template_day_tasks").insert(dayInserts);
}
