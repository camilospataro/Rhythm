"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TaskType, QualityType } from "@/types/database";

export async function createTask(data: {
  name: string;
  type: TaskType;
  color?: string;
}) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      name: data.name,
      type: data.type,
      color: data.color || null,
      rating_min: 0,
      rating_max: 0,
      sort_order: 0,
      archived: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  return task;
}

export async function updateTask(
  taskId: string,
  data: {
    name?: string;
    type?: TaskType;
    color?: string | null;
    archived?: boolean;
    sort_order?: number;
    rating_max?: number;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function createTaskQuality(
  taskId: string,
  name: string,
  type: QualityType = "checkbox",
  ratingMax: number = 5,
  tags: string[] = []
) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data: quality, error } = await supabase
    .from("task_qualities")
    .insert({
      task_id: taskId,
      user_id: userId,
      name,
      type,
      rating_max: ratingMax,
      tags,
      sort_order: 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  return quality;
}

export async function updateTaskQuality(
  qualityId: string,
  name: string,
  type: QualityType = "checkbox",
  ratingMax: number = 5,
  tags: string[] = []
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_qualities")
    .update({ name, type, rating_max: ratingMax, tags })
    .eq("id", qualityId);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function deleteTaskQuality(qualityId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_qualities")
    .delete()
    .eq("id", qualityId);

  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}
