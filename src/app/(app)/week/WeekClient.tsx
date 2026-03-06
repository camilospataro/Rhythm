"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { assignWeek, unassignWeek } from "@/actions/templates";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/layout/LogoutButton";
import type { Completion } from "@/types/database";

interface DayTask {
  task_id: string;
  tasks: { id: string; name: string; type: string; color: string | null };
}

interface TemplateOption {
  id: string;
  name: string;
  is_default: boolean;
}

interface WeekClientProps {
  year: number;
  week: number;
  templateName: string | undefined;
  weekDates: string[];
  dayNames: string[];
  dayTasks: Record<number, DayTask[]>;
  completions: Completion[];
  templates: TemplateOption[];
  currentTemplateId: string | null;
  hasExplicitAssignment: boolean;
}

export default function WeekClient({
  year,
  week,
  templateName,
  weekDates,
  dayNames,
  dayTasks,
  completions,
  templates,
  currentTemplateId,
  hasExplicitAssignment,
}: WeekClientProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [showSelector, setShowSelector] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleTemplateChange(templateId: string | null) {
    startTransition(async () => {
      try {
        if (templateId === null) {
          await unassignWeek(year, week);
        } else {
          await assignWeek(year, week, templateId);
        }
        setShowSelector(false);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  const currentTemplate = templates.find((t) => t.id === currentTemplateId);
  const defaultTemplate = templates.find((t) => t.is_default);

  function navigate(offset: number) {
    let newWeek = week + offset;
    let newYear = year;
    if (newWeek < 1) {
      newYear--;
      newWeek = 52;
    } else if (newWeek > 52) {
      newYear++;
      newWeek = 1;
    }
    router.push(`/week?year=${newYear}&week=${newWeek}`);
  }

  return (
    <div>
      {/* Logo Header */}
      <header className="bg-surface glass border-b border-border shadow-[var(--glass-shadow)]">
        <div className="px-4 max-w-lg mx-auto h-14 flex items-center">
          <div className="w-[4.5rem] flex-shrink-0" />
          <div className="flex-1 flex items-center justify-center">
            <Image src="/logo.png" alt="Rhythm" width={100} height={32} className="h-7 w-auto dark:invert" priority />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
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
      </header>

      <div className="p-4 max-w-lg mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Button>
        <button
          onClick={() => router.push("/week")}
          className="text-center flex flex-col items-center"
        >
          <span className="text-sm font-semibold">Week {week}</span>
          <span className="text-xs text-muted">
            {templateName ? `Template: ${templateName}` : "No template assigned"}
          </span>
        </button>
        <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Button>
      </div>

      {/* Template Selector */}
      <div className="mb-4">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
            "bg-surface border border-border hover:bg-surface-hover"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span className="truncate font-medium">
              {currentTemplate?.name || "No template"}
            </span>
            {!hasExplicitAssignment && currentTemplate && (
              <span className="text-[10px] text-muted bg-surface-hover px-1.5 py-0.5 rounded flex-shrink-0">default</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isPending && (
              <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            )}
            <svg
              className={cn("w-4 h-4 text-muted transition-transform", showSelector && "rotate-180")}
              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </button>

        {showSelector && (
          <div className="mt-1 rounded-lg border border-border bg-surface overflow-hidden">
            {/* Use default option */}
            {hasExplicitAssignment && defaultTemplate && (
              <button
                onClick={() => handleTemplateChange(null)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-surface-hover transition-colors border-b border-border"
              >
                <span className="text-muted">Use default</span>
                <span className="text-xs text-muted">({defaultTemplate.name})</span>
              </button>
            )}
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplateChange(t.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-surface-hover transition-colors",
                  t.id === currentTemplateId && "bg-primary/5 text-primary"
                )}
              >
                <span className="font-medium">{t.name}</span>
                <div className="flex items-center gap-1.5">
                  {t.is_default && (
                    <span className="text-[10px] text-muted bg-surface-hover px-1.5 py-0.5 rounded">default</span>
                  )}
                  {t.id === currentTemplateId && (
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
            {templates.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted text-center">No templates created yet</p>
            )}
          </div>
        )}
      </div>

      {/* Week Grid */}
      <div className="space-y-2">
        {weekDates.map((dateStr, dayIndex) => {
          const tasks = dayTasks[dayIndex] || [];
          const isToday = dateStr === today;
          const dayCompletions = completions.filter((c) => c.date === dateStr);

          const completedCount = tasks.filter((dt) => {
            const completion = dayCompletions.find((c) => c.task_id === dt.task_id);
            if (!completion) return false;
            if (dt.tasks.type === "checkbox") return completion.completed;
            if (dt.tasks.type === "rating") return completion.rating != null;
            return completion.completed;
          }).length;

          return (
            <Card
              key={dateStr}
              className={cn(
                "cursor-pointer hover:bg-surface-hover transition-colors",
                isToday && "ring-2 ring-primary/50"
              )}
              onClick={() => router.push(`/day?date=${dateStr}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-semibold",
                    isToday && "text-primary"
                  )}>
                    {dayNames[dayIndex]}
                  </span>
                  <span className="text-xs text-muted">
                    {dateStr.slice(5)}
                  </span>
                </div>
                {tasks.length > 0 && (
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    completedCount === tasks.length && tasks.length > 0
                      ? "bg-success/10 text-success"
                      : completedCount > 0
                        ? "bg-warning/10 text-warning"
                        : "bg-surface-hover text-muted"
                  )}>
                    {completedCount}/{tasks.length}
                  </span>
                )}
              </div>
              {tasks.length === 0 ? (
                <p className="text-xs text-muted">No tasks</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tasks.map((dt) => {
                    const completion = dayCompletions.find((c) => c.task_id === dt.task_id);
                    const done =
                      (dt.tasks.type === "checkbox" && completion?.completed) ||
                      (dt.tasks.type === "rating" && completion?.rating != null) ||
                      (dt.tasks.type === "multi_quality" && completion?.completed);

                    return (
                      <span
                        key={dt.task_id}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                          done
                            ? "bg-success/10 text-success line-through"
                            : "bg-surface-hover text-muted"
                        )}
                      >
                        {dt.tasks.color && (
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: dt.tasks.color }}
                          />
                        )}
                        {dt.tasks.name}
                        {dt.tasks.type === "rating" && completion?.rating != null && (
                          <span className="font-medium"> {completion.rating}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      </div>
    </div>
  );
}
