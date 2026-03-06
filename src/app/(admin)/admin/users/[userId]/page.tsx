import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import UserDetailClient from "./UserDetailClient";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = createAdminClient();

  // Get auth user info
  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  if (!authData?.user) notFound();

  const user = authData.user;

  // Get tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Get templates
  const { data: templates } = await supabase
    .from("week_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Get recent completions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: completions } = await supabase
    .from("completions")
    .select("*, tasks(name, type)")
    .eq("user_id", userId)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  // Get task qualities
  const { data: qualities } = await supabase
    .from("task_qualities")
    .select("*")
    .eq("user_id", userId);

  return (
    <UserDetailClient
      user={{
        id: user.id,
        email: user.email || "No email",
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at || null,
      }}
      tasks={tasks || []}
      templates={templates || []}
      completions={completions || []}
      qualities={qualities || []}
    />
  );
}
