import { createAdminClient } from "@/lib/supabase/admin";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createAdminClient();

  // Get all auth users
  const { data: authData } = await supabase.auth.admin.listUsers();
  const users = authData?.users || [];

  // Get task counts per user
  const { data: tasks } = await supabase
    .from("tasks")
    .select("user_id");

  const taskCounts: Record<string, number> = {};
  if (tasks) {
    for (const t of tasks) {
      taskCounts[t.user_id] = (taskCounts[t.user_id] || 0) + 1;
    }
  }

  // Get completion counts per user
  const { data: completions } = await supabase
    .from("completions")
    .select("user_id");

  const completionCounts: Record<string, number> = {};
  if (completions) {
    for (const c of completions) {
      completionCounts[c.user_id] = (completionCounts[c.user_id] || 0) + 1;
    }
  }

  // Get template counts per user
  const { data: templates } = await supabase
    .from("week_templates")
    .select("user_id");

  const templateCounts: Record<string, number> = {};
  if (templates) {
    for (const t of templates) {
      templateCounts[t.user_id] = (templateCounts[t.user_id] || 0) + 1;
    }
  }

  const userList = users.map((u) => ({
    id: u.id,
    email: u.email || "No email",
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at || null,
    taskCount: taskCounts[u.id] || 0,
    completionCount: completionCounts[u.id] || 0,
    templateCount: templateCounts[u.id] || 0,
  }));

  return <AdminDashboard users={userList} />;
}
