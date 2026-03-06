"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminDeleteUser } from "@/actions/admin";

interface UserSummary {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  taskCount: number;
  completionCount: number;
  templateCount: number;
}

export default function AdminDashboard({ users }: { users: UserSummary[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(userId: string, email: string) {
    if (!confirm(`Delete user "${email}" and ALL their data? This cannot be undone.`)) return;
    startTransition(async () => {
      await adminDeleteUser(userId);
      router.refresh();
    });
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-sm text-muted">{users.length} total users</p>
        </div>
        {isPending && (
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        )}
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <button
              onClick={() => router.push(`/admin/users/${user.id}`)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="font-medium text-sm truncate">{user.email}</p>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted">
                <span>{user.taskCount} tasks</span>
                <span>{user.templateCount} templates</span>
                <span>{user.completionCount} completions</span>
              </div>
              <div className="flex gap-3 mt-1 text-xs text-muted">
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                {user.lastSignIn && (
                  <span>Last login {new Date(user.lastSignIn).toLocaleDateString()}</span>
                )}
              </div>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => router.push(`/admin/users/${user.id}`)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                View
              </button>
              <button
                onClick={() => handleDelete(user.id, user.email)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
