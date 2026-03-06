"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import CheckboxTask from "@/components/day/CheckboxTask";
import MultiQualityTask from "@/components/day/MultiQualityTask";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { ResolvedTask } from "@/lib/resolveTemplate";
import { addDayTask, removeDayTask } from "@/actions/dayTasks";
import { formatDate, formatDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { addDays } from "date-fns";
import Link from "next/link";
import LogoutButton from "@/components/layout/LogoutButton";
import AdminButton from "@/components/layout/AdminButton";

interface TaskOption {
  id: string;
  name: string;
  type: string;
  color: string | null;
}

interface DayClientProps {
  tasks: ResolvedTask[];
  date: string;
  displayDate: string;
  completedCount: number;
  allTasks: TaskOption[];
  isAdmin?: boolean;
  impersonatingEmail?: string | null;
}

export default function DayClient({ tasks, date, displayDate, completedCount, allTasks, isAdmin: admin, impersonatingEmail }: DayClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticDate, setOptimisticDate] = useState(date);
  const [showPicker, setShowPicker] = useState(false);

  const templateTasks = useMemo(() => tasks.filter((t) => !t.isStandalone), [tasks]);
  const standaloneTasks = useMemo(() => tasks.filter((t) => t.isStandalone), [tasks]);
  const availableTasks = useMemo(() => {
    const taskIdsOnDay = new Set(tasks.map((t) => t.id));
    return allTasks.filter((t) => !taskIdsOnDay.has(t.id));
  }, [tasks, allTasks]);

  function renderTask(task: ResolvedTask, taskDate: string) {
    switch (task.type) {
      case "checkbox":
        return <CheckboxTask key={task.id} task={task} date={taskDate} />;
      case "multi_quality":
        return <MultiQualityTask key={task.id} task={task} date={taskDate} />;
      default:
        return null;
    }
  }

  // Use optimistic date for display, fall back to server date when synced
  const shownDate = isPending ? optimisticDate : date;
  const shownDisplayDate = isPending
    ? formatDisplayDate(new Date(optimisticDate + "T00:00:00"))
    : displayDate;
  const isToday = shownDate === formatDate(new Date());

  function goToDate(offset: number) {
    const current = new Date(shownDate + "T00:00:00");
    const next = addDays(current, offset);
    const nextStr = formatDate(next);
    setOptimisticDate(nextStr);
    startTransition(() => {
      router.push(`/day?date=${nextStr}`);
    });
  }

  return (
    <div>
      {/* Date Navigation */}
      <div className="bg-surface glass border-b border-border shadow-[var(--glass-shadow)]">
        <div className="flex items-center h-14 max-w-lg mx-auto px-4">
          <div className="w-[4.5rem] flex-shrink-0">
            {admin && <AdminButton impersonatingEmail={impersonatingEmail} />}
          </div>
          <div className="flex-1 flex items-center justify-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => goToDate(-1)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </Button>
            <button
              onClick={() => router.push("/day")}
              className={cn(
                "text-center px-4 py-1 rounded-lg transition-colors flex flex-col items-center justify-center",
                isToday && "bg-primary text-white"
              )}
            >
              <p className={cn("text-xs font-semibold", isToday ? "visible" : "invisible")}>Today</p>
              <p className="text-sm font-semibold">{shownDisplayDate}</p>
              <p className={cn("text-xs", isToday ? "text-white/70" : "text-muted")}>
                {isPending ? "..." : `${completedCount}/${tasks.length} done`}
              </p>
            </button>
            <Button variant="ghost" size="sm" onClick={() => goToDate(1)}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Button>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link
              href="/guide"
              className="w-8 h-8 rounded-full border border-border bg-surface-hover flex items-center justify-center text-muted hover:text-primary hover:border-primary/30 transition-colors"
              aria-label="Help & Guide"
              title="Help & Guide"
            >
              <span className="text-xs font-semibold">?</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">

      {/* Progress Bar — above tasks */}
      {tasks.length > 0 && (
        <div className={cn(isPending && "opacity-50 transition-opacity")}>
          <ProgressBar tasks={tasks} />
        </div>
      )}

      {/* Task List */}
      <div className={cn(isPending && "opacity-50 pointer-events-none transition-opacity")}>
        {tasks.length === 0 && !showPicker ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-muted text-sm mb-2">No tasks scheduled for this day</p>
              <p className="text-xs text-muted">
                Assign tasks in the Task Manager by creating a template and assigning it to this week.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Template tasks */}
            {templateTasks.map((task) => renderTask(task, date))}

            {/* Divider between template and standalone */}
            {templateTasks.length > 0 && standaloneTasks.length > 0 && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 border-t border-border border-dashed" />
                <span className="text-[10px] text-muted uppercase tracking-wider">Added</span>
                <div className="flex-1 border-t border-border border-dashed" />
              </div>
            )}

            {/* Standalone tasks with remove button */}
            {standaloneTasks.map((task) => (
              <div key={task.id} className="relative group">
                {renderTask(task, date)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startTransition(async () => {
                      await removeDayTask(task.id, date);
                      router.refresh();
                    });
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted hover:text-danger"
                  aria-label="Remove from day"
                  title="Remove from day"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Task Button + Picker */}
        {allTasks.length > 0 && (
          <div className="mt-3">
            {showPicker ? (
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium text-muted">Add a task to this day</span>
                  <button
                    onClick={() => setShowPicker(false)}
                    className="text-muted hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {availableTasks.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted text-center">All tasks are already on this day</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    {availableTasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          startTransition(async () => {
                            await addDayTask(t.id, date);
                            setShowPicker(false);
                            router.refresh();
                          });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-surface-hover transition-colors"
                      >
                        {t.color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                        )}
                        <span className="font-medium">{t.name}</span>
                        <span className="text-xs text-muted ml-auto">{t.type === "multi_quality" ? "Multi" : "Checkbox"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowPicker(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted hover:text-foreground hover:border-primary/50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Task
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function ProgressBar({ tasks }: { tasks: ResolvedTask[] }) {
  const completed = tasks.filter((t) => {
    if (t.type === "checkbox") return t.completion?.completed;
    if (t.type === "multi_quality") {
      const mainDone = t.rating_max > 0
        ? t.completion?.rating != null
        : t.completion?.completed ?? false;
      const subsDone = t.qualities.length === 0 || t.qualityCompletions.filter((qc) => {
        const q = t.qualities.find((qual) => qual.id === qc.quality_id);
        if (!q) return false;
        return q.type === "checkbox" ? qc.completed : qc.rating != null;
      }).length === t.qualities.length;
      return mainDone && subsDone;
    }
    return false;
  }).length;

  const pct = Math.round((completed / tasks.length) * 100);

  // Interpolate from red (0%) → amber (50%) → green (100%)
  function getProgressColor(percent: number): string {
    if (percent <= 50) {
      // Red to amber: hue 0 → 40
      const hue = (percent / 50) * 40;
      return `hsl(${hue}, 75%, 50%)`;
    } else {
      // Amber to green: hue 40 → 142
      const hue = 40 + ((percent - 50) / 50) * 102;
      return `hsl(${hue}, 65%, 45%)`;
    }
  }

  const barColor = getProgressColor(pct);

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Daily Progress</span>
        <span className="text-sm font-semibold" style={{ color: barColor }}>
          {completed}/{tasks.length} — {pct}%
        </span>
      </div>
      <div className="h-2.5 bg-surface-hover rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
