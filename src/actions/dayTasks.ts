"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function revalidateAll() {
  revalidatePath("/day");
  revalidatePath("/week");
  revalidatePath("/month");
}

export async function addDayTask(taskId: string, date: string) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase.from("day_tasks").insert({
    user_id: userId,
    task_id: taskId,
    date,
  });

  if (error) throw new Error(`addDayTask: ${error.message}`);
  revalidateAll();
}

export async function removeDayTask(taskId: string, date: string) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("day_tasks")
    .delete()
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .eq("date", date);

  if (error) throw new Error(`removeDayTask: ${error.message}`);
  revalidateAll();
}
