"use server";

import { createClient, getUserId } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function revalidateAll() {
  revalidatePath("/day");
  revalidatePath("/week");
  revalidatePath("/month");
}

export async function toggleCompletion(taskId: string, date: string) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("completions")
    .select()
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .eq("date", date)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("completions")
      .update({ completed: !existing.completed })
      .eq("id", existing.id);
    if (error) throw new Error(`toggleCompletion update: ${error.message}`);
  } else {
    const { error } = await supabase.from("completions").insert({
      user_id: userId,
      task_id: taskId,
      date,
      completed: true,
    });
    if (error) throw new Error(`toggleCompletion insert: ${error.message}`);
  }

  revalidateAll();
}

export async function setRating(taskId: string, date: string, rating: number) {
  console.log("[setRating] called:", { taskId, date, rating });
  const supabase = await createClient();
  const userId = await getUserId();
  console.log("[setRating] userId:", userId);
  if (!userId) throw new Error("Not authenticated");

  const { data: existing, error: fetchErr } = await supabase
    .from("completions")
    .select()
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .eq("date", date)
    .single();

  console.log("[setRating] existing:", existing, "fetchErr:", fetchErr?.message);

  if (existing) {
    const { error } = await supabase
      .from("completions")
      .update({ rating })
      .eq("id", existing.id);
    console.log("[setRating] update result:", error?.message || "OK");
    if (error) throw new Error(`setRating update: ${error.message}`);
  } else {
    const { error } = await supabase.from("completions").insert({
      user_id: userId,
      task_id: taskId,
      date,
      rating,
    });
    console.log("[setRating] insert result:", error?.message || "OK");
    if (error) throw new Error(`setRating insert: ${error.message}`);
  }

  revalidateAll();
}

async function getOrCreateCompletion(supabase: any, userId: string, taskId: string, date: string) {
  const { data: completion } = await supabase
    .from("completions")
    .select()
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .eq("date", date)
    .single();

  if (completion) return completion;

  const { data: newCompletion, error } = await supabase
    .from("completions")
    .insert({ user_id: userId, task_id: taskId, date })
    .select()
    .single();

  if (error) throw new Error(`getOrCreateCompletion: ${error.message}`);
  if (!newCompletion) throw new Error("Failed to create completion");
  return newCompletion;
}

export async function setQualityRating(
  taskId: string,
  date: string,
  qualityId: string,
  rating: number
) {
  console.log("[setQualityRating] called:", { taskId, date, qualityId, rating });
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const completion = await getOrCreateCompletion(supabase, userId, taskId, date);
  console.log("[setQualityRating] completion:", completion.id);

  const { data: existing } = await supabase
    .from("quality_completions")
    .select()
    .eq("completion_id", completion.id)
    .eq("quality_id", qualityId)
    .single();

  console.log("[setQualityRating] existing:", existing);

  if (existing) {
    const { error } = await supabase
      .from("quality_completions")
      .update({ rating })
      .eq("id", existing.id);
    console.log("[setQualityRating] update:", error?.message || "OK");
    if (error) throw new Error(`setQualityRating update: ${error.message}`);
  } else {
    const { error } = await supabase.from("quality_completions").insert({
      completion_id: completion.id,
      quality_id: qualityId,
      user_id: userId,
      rating,
    });
    console.log("[setQualityRating] insert:", error?.message || "OK");
    if (error) throw new Error(`setQualityRating insert: ${error.message}`);
  }

  revalidateAll();
}

export async function toggleQualityCheckbox(
  taskId: string,
  date: string,
  qualityId: string
) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const completion = await getOrCreateCompletion(supabase, userId, taskId, date);

  const { data: existing } = await supabase
    .from("quality_completions")
    .select()
    .eq("completion_id", completion.id)
    .eq("quality_id", qualityId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("quality_completions")
      .update({ completed: !existing.completed })
      .eq("id", existing.id);
    if (error) throw new Error(`toggleQualityCheckbox update: ${error.message}`);
  } else {
    const { error } = await supabase.from("quality_completions").insert({
      completion_id: completion.id,
      quality_id: qualityId,
      user_id: userId,
      completed: true,
      rating: 0,
    });
    if (error) throw new Error(`toggleQualityCheckbox insert: ${error.message}`);
  }

  revalidateAll();
}

export async function updateQualityTags(
  taskId: string,
  date: string,
  qualityId: string,
  selectedTags: string[]
) {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const completion = await getOrCreateCompletion(supabase, userId, taskId, date);

  const { data: existing } = await supabase
    .from("quality_completions")
    .select()
    .eq("completion_id", completion.id)
    .eq("quality_id", qualityId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("quality_completions")
      .update({ selected_tags: selectedTags })
      .eq("id", existing.id);
    if (error) throw new Error(`updateQualityTags update: ${error.message}`);
  } else {
    const { error } = await supabase.from("quality_completions").insert({
      completion_id: completion.id,
      quality_id: qualityId,
      user_id: userId,
      selected_tags: selectedTags,
      rating: 0,
    });
    if (error) throw new Error(`updateQualityTags insert: ${error.message}`);
  }

  revalidateAll();
}
