import { createClient, getUserId } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import TaskListClient from "./TaskListClient";
import { getAdminInfo } from "@/lib/admin";

export default async function TasksPage() {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return null;
  const adminInfo = await getAdminInfo();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("sort_order")
    .order("created_at");

  const { data: templates } = await supabase
    .from("week_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");

  return (
    <div>
      <Header title="Task Manager" isAdmin={!!adminInfo} impersonatingEmail={adminInfo?.impersonatingEmail} />
      <TaskListClient tasks={tasks || []} templates={templates || []} />
    </div>
  );
}
