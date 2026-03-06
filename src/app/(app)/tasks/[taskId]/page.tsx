import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import TaskEditClient from "./TaskEditClient";

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) notFound();

  const { data: qualities } = await supabase
    .from("task_qualities")
    .select("*")
    .eq("task_id", taskId)
    .order("sort_order")
    .order("created_at");

  return (
    <div>
      <Header title="Edit Task" subtitle={task.name} backHref="/tasks" />
      <TaskEditClient task={task} qualities={qualities || []} />
    </div>
  );
}
