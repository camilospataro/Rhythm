"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminDeleteTask, adminDeleteTemplate, adminDeleteUser } from "@/actions/admin";
import Link from "next/link";

interface UserInfo {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
}

interface Task {
  id: string;
  name: string;
  type: string;
  color: string | null;
  archived: boolean;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

interface Completion {
  id: string;
  task_id: string;
  date: string;
  completed: boolean;
  rating: number | null;
  tasks: { name: string; type: string } | null;
}

interface Quality {
  id: string;
  task_id: string;
  name: string;
  type: string;
  rating_max: number;
}

interface UserDetailClientProps {
  user: UserInfo;
  tasks: Task[];
  templates: Template[];
  completions: Completion[];
  qualities: Quality[];
}

export default function UserDetailClient({
  user,
  tasks,
  templates,
  completions,
  qualities,
}: UserDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDeleteTask(taskId: string, taskName: string) {
    if (!confirm(`Delete task "${taskName}" and all its data?`)) return;
    startTransition(async () => {
      await adminDeleteTask(taskId);
      router.refresh();
    });
  }

  function handleDeleteTemplate(templateId: string, templateName: string) {
    if (!confirm(`Delete template "${templateName}"?`)) return;
    startTransition(async () => {
      await adminDeleteTemplate(templateId);
      router.refresh();
    });
  }

  function handleDeleteUser() {
    if (!confirm(`DELETE user "${user.email}" and ALL their data? This CANNOT be undone.`)) return;
    if (!confirm(`Are you ABSOLUTELY sure? This will permanently delete everything.`)) return;
    startTransition(async () => {
      await adminDeleteUser(user.id);
      router.push("/admin");
    });
  }

  const qualitiesByTask = new Map<string, Quality[]>();
  for (const q of qualities) {
    if (!qualitiesByTask.has(q.task_id)) qualitiesByTask.set(q.task_id, []);
    qualitiesByTask.get(q.task_id)!.push(q);
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Back link */}
      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-block">
        &larr; Back to Users
      </Link>

      {/* User header */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold">{user.email}</h1>
            <p className="text-xs text-muted mt-1">ID: {user.id}</p>
            <div className="flex gap-4 mt-2 text-sm text-muted">
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              {user.lastSignIn && (
                <span>Last login {new Date(user.lastSignIn).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex gap-4 mt-2 text-sm">
              <span>{tasks.length} tasks</span>
              <span>{templates.length} templates</span>
              <span>{completions.length} completions (30d)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            )}
            <button
              onClick={handleDeleteUser}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3">Tasks ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted">No tasks</p>
        ) : (
          <div className="space-y-1.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {task.color && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.name}
                      {task.archived && (
                        <span className="ml-2 text-xs text-muted">(archived)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">{task.type}</p>
                    {qualitiesByTask.has(task.id) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {qualitiesByTask.get(task.id)!.map((q) => (
                          <span key={q.id} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-muted">
                            {q.name} ({q.type}{q.type === "rating" ? ` 1-${q.rating_max}` : ""})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id, task.name)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-danger hover:bg-danger/10 transition-colors flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Templates */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3">Templates ({templates.length})</h2>
        {templates.length === 0 ? (
          <p className="text-sm text-muted">No templates</p>
        ) : (
          <div className="space-y-1.5">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {template.name}
                    {template.is_default && (
                      <span className="ml-2 text-xs text-primary">(default)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTemplate(template.id, template.name)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-danger hover:bg-danger/10 transition-colors flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Completions */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3">Recent Completions ({completions.length})</h2>
        {completions.length === 0 ? (
          <p className="text-sm text-muted">No completions in last 30 days</p>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Task</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {completions.slice(0, 50).map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-muted">{c.date}</td>
                    <td className="px-4 py-2">
                      {c.tasks?.name || c.task_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2">
                      {c.completed ? (
                        <span className="text-success">Done</span>
                      ) : c.rating != null ? (
                        <span className="text-primary">Rated {c.rating}</span>
                      ) : (
                        <span className="text-muted">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {completions.length > 50 && (
              <p className="text-xs text-muted text-center py-2">
                Showing 50 of {completions.length} completions
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
