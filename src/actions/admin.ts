"use server";

import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}

export async function adminDeleteTask(taskId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  // Delete related data first
  await supabase.from("quality_completions").delete().eq("completion_id",
    // subquery not supported, so delete via completions
    taskId // handled below
  );

  // Delete completions for this task
  const { data: completions } = await supabase
    .from("completions")
    .select("id")
    .eq("task_id", taskId);

  if (completions && completions.length > 0) {
    const completionIds = completions.map((c) => c.id);
    await supabase.from("quality_completions").delete().in("completion_id", completionIds);
  }

  await supabase.from("completions").delete().eq("task_id", taskId);
  await supabase.from("template_day_tasks").delete().eq("task_id", taskId);
  await supabase.from("day_tasks").delete().eq("task_id", taskId);
  await supabase.from("task_qualities").delete().eq("task_id", taskId);
  await supabase.from("tasks").delete().eq("id", taskId);

  revalidatePath("/admin");
}

export async function adminDeleteTemplate(templateId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  await supabase.from("week_assignments").delete().eq("template_id", templateId);
  await supabase.from("template_day_tasks").delete().eq("template_id", templateId);
  await supabase.from("week_templates").delete().eq("id", templateId);

  revalidatePath("/admin");
}

export async function adminDeleteUser(userId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  // Get all task IDs for this user
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId);

  if (tasks) {
    for (const task of tasks) {
      // Delete quality completions via completions
      const { data: completions } = await supabase
        .from("completions")
        .select("id")
        .eq("task_id", task.id);

      if (completions && completions.length > 0) {
        await supabase.from("quality_completions").delete().in("completion_id", completions.map((c) => c.id));
      }
    }
  }

  // Delete all user data in order
  await supabase.from("completions").delete().eq("user_id", userId);
  await supabase.from("day_tasks").delete().eq("user_id", userId);
  await supabase.from("template_day_tasks").delete().eq("user_id", userId);
  await supabase.from("week_assignments").delete().eq("user_id", userId);
  await supabase.from("task_qualities").delete().eq("user_id", userId);
  await supabase.from("tasks").delete().eq("user_id", userId);
  await supabase.from("week_templates").delete().eq("user_id", userId);

  // Delete auth user
  await supabase.auth.admin.deleteUser(userId);

  revalidatePath("/admin");
}
