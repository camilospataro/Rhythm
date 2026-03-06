"use client";

import { useTransition } from "react";
import { toggleCompletion } from "@/actions/completions";
import type { ResolvedTask } from "@/lib/resolveTemplate";
import { getTimeState, getScheduleLabel } from "@/lib/schedule";
import { cn } from "@/lib/utils";

interface CheckboxTaskProps {
  task: ResolvedTask;
  date: string;
}

export default function CheckboxTask({ task, date }: CheckboxTaskProps) {
  const [isPending, startTransition] = useTransition();
  const isCompleted = task.completion?.completed === true;
  const timeState = getTimeState(task.schedule);
  const isLocked = timeState === "locked" && !isCompleted;
  const isOverdue = timeState === "overdue";
  const isUpcoming = timeState === "upcoming";
  const scheduleLabel = getScheduleLabel(task.schedule, timeState);

  function handleToggle() {
    if (isLocked) return;
    startTransition(async () => {
      try {
        await toggleCompletion(task.id, date);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isPending || isLocked}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
          isLocked
            ? "bg-surface/50 border border-border opacity-50 cursor-not-allowed"
            : isCompleted
              ? "bg-success/10 border border-success/30"
              : isOverdue
                ? "bg-warning/5 border border-warning/30"
                : isUpcoming
                  ? "bg-surface border border-border/50 opacity-70"
                  : "bg-surface border border-border hover:bg-surface-hover"
        )}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
            isLocked
              ? "border-border bg-surface-hover"
              : isCompleted
                ? "border-success bg-success"
                : "border-border"
          )}
        >
          {isLocked ? (
            <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          ) : isCompleted ? (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : null}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {task.color && (
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.color }}
              />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                isCompleted && "line-through text-muted",
                isLocked && "text-muted"
              )}
            >
              {task.name}
            </span>
          </div>
          {scheduleLabel && !isCompleted && (
            <span
              className={cn(
                "text-[11px] mt-0.5",
                isLocked ? "text-muted" : isOverdue ? "text-warning" : "text-muted"
              )}
            >
              {scheduleLabel}
            </span>
          )}
        </div>
        {isPending && (
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        )}
      </button>
    </div>
  );
}
