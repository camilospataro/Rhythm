import { createClient, getUserId } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import TemplateEditClient from "./TemplateEditClient";

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return null;

  const { data: template } = await supabase
    .from("week_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (!template) notFound();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("sort_order")
    .order("created_at");

  const { data: dayTasks } = await supabase
    .from("template_day_tasks")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order");

  return (
    <div>
      <Header title="Edit Template" subtitle={template.name} backHref="/tasks" />
      <TemplateEditClient
        template={template}
        tasks={tasks || []}
        dayTasks={dayTasks || []}
      />
    </div>
  );
}
