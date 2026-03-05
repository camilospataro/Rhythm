"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { updateTemplate, deleteTemplate, setTemplateDayTasks } from "@/actions/templates";
import type { TaskDayConfig } from "@/actions/templates";
import type { Task, WeekTemplate, TemplateDayTask } from "@/types/database";
import { cn } from "@/lib/utils";

interface TemplateEditClientProps {
  template: WeekTemplate;
  tasks: Task[];
  dayTasks: TemplateDayTask[];
}

interface LocalTaskConfig {
  taskId: string;
  deadline_time: string | null;
  window_start: string | null;
  window_end: string | null;
  time_strict: boolean;
}

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAYS = [0, 1, 2, 3, 4];
const WEEKENDS = [5, 6];
const EVERYDAY = [0, 1, 2, 3, 4, 5, 6];

export default function TemplateEditClient({
  template,
  tasks,
  dayTasks,
}: TemplateEditClientProps) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [saving, setSaving] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Build a map: day_of_week -> LocalTaskConfig[]
  const initialDayConfigs: Record<number, LocalTaskConfig[]> = {};
  for (let i = 0; i < 7; i++) {
    initialDayConfigs[i] = dayTasks
      .filter((dt) => dt.day_of_week === i)
      .map((dt) => ({
        taskId: dt.task_id,
        deadline_time: dt.deadline_time || null,
        window_start: dt.window_start || null,
        window_end: dt.window_end || null,
        time_strict: dt.time_strict ?? false,
      }));
  }

  const [localDayConfigs, setLocalDayConfigs] = useState(initialDayConfigs);

  // Check if a task is assigned to a specific day
  function isTaskOnDay(taskId: string, day: number): boolean {
    return (localDayConfigs[day] || []).some((c) => c.taskId === taskId);
  }

  // Get all days a task is assigned to
  function getTaskDays(taskId: string): number[] {
    return EVERYDAY.filter((d) => isTaskOnDay(taskId, d));
  }

  // Toggle one task for one day
  function toggleTaskDay(taskId: string, day: number) {
    setLocalDayConfigs((prev) => {
      const current = prev[day] || [];
      if (current.some((c) => c.taskId === taskId)) {
        return { ...prev, [day]: current.filter((c) => c.taskId !== taskId) };
      }
      // When adding, copy schedule from an existing day if available
      const existingConfig = EVERYDAY
        .map((d) => (prev[d] || []).find((c) => c.taskId === taskId))
        .find(Boolean);
      const newConfig: LocalTaskConfig = existingConfig
        ? { ...existingConfig }
        : { taskId, deadline_time: null, window_start: null, window_end: null, time_strict: false };
      return { ...prev, [day]: [...current, newConfig] };
    });
  }

  // Preset toggle for a single task: if task has all `days`, remove them; else add missing
  function presetToggle(taskId: string, days: number[]) {
    setLocalDayConfigs((prev) => {
      const allAssigned = days.every((d) => (prev[d] || []).some((c) => c.taskId === taskId));
      const next = { ...prev };
      if (allAssigned) {
        for (const d of days) {
          next[d] = (prev[d] || []).filter((c) => c.taskId !== taskId);
        }
      } else {
        for (const d of days) {
          const current = next[d] || [];
          if (!current.some((c) => c.taskId === taskId)) {
            const existingConfig = EVERYDAY
              .map((ed) => (prev[ed] || []).find((c) => c.taskId === taskId))
              .find(Boolean);
            next[d] = [
              ...current,
              existingConfig
                ? { ...existingConfig }
                : { taskId, deadline_time: null, window_start: null, window_end: null, time_strict: false },
            ];
          }
        }
      }
      return next;
    });
  }

  // Get schedule config for a task (from first assigned day, since uniform)
  function getConfig(taskId: string): LocalTaskConfig | undefined {
    for (const d of EVERYDAY) {
      const config = (localDayConfigs[d] || []).find((c) => c.taskId === taskId);
      if (config) return config;
    }
    return undefined;
  }

  function hasSchedule(config: LocalTaskConfig | undefined): boolean {
    if (!config) return false;
    return config.deadline_time != null || config.window_start != null || config.window_end != null;
  }

  // Update schedule for a task across ALL its assigned days
  function updateTaskConfig(taskId: string, updates: Partial<LocalTaskConfig>) {
    setLocalDayConfigs((prev) => {
      const next = { ...prev };
      for (const d of EVERYDAY) {
        const current = prev[d] || [];
        next[d] = current.map((c) =>
          c.taskId === taskId ? { ...c, ...updates } : c
        );
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (name !== template.name) {
        await updateTemplate(template.id, { name });
      }
      for (let day = 0; day < 7; day++) {
        const original = initialDayConfigs[day] || [];
        const updated = localDayConfigs[day] || [];
        if (JSON.stringify(original) !== JSON.stringify(updated)) {
          const configs: TaskDayConfig[] = updated.map((c) => ({
            taskId: c.taskId,
            deadline_time: c.deadline_time,
            window_start: c.window_start,
            window_end: c.window_end,
            time_strict: c.time_strict,
          }));
          await setTemplateDayTasks(template.id, day, configs);
        }
      }
      router.push("/tasks");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (confirm("Delete this template? This cannot be undone.")) {
      await deleteTemplate(template.id);
      router.push("/tasks");
    }
  }

  async function handleSetDefault() {
    await updateTemplate(template.id, { is_default: true });
  }

  function formatTime(time: string | null): string {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Template Name */}
      <Card>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2">
            {!template.is_default && (
              <Button size="sm" variant="secondary" onClick={handleSetDefault}>
                Set as Default
              </Button>
            )}
            {template.is_default && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Default Template
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Task Day Assignment */}
      <Card>
        <h3 className="text-sm font-medium mb-3">Assign Tasks to Days</h3>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            No tasks available. Create tasks first in the Task Manager.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const taskDays = getTaskDays(task.id);
              const hasAnyDay = taskDays.length > 0;
              const config = getConfig(task.id);
              const isExpanded = expandedTask === task.id;
              const scheduled = hasSchedule(config);

              return (
                <div key={task.id}>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2.5 transition-colors",
                      hasAnyDay
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-surface-hover border border-transparent"
                    )}
                  >
                    {/* Task name row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {task.color && (
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: task.color }}
                          />
                        )}
                        <span className={cn("text-sm font-medium truncate", hasAnyDay && "text-primary")}>
                          {task.name}
                        </span>
                      </div>
                      {hasAnyDay && (
                        <button
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                          className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors flex-shrink-0",
                            scheduled
                              ? "bg-warning/15 text-warning"
                              : "text-muted hover:text-foreground"
                          )}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Day pills + presets */}
                    <div className="flex gap-1 items-center">
                      {DAY_LETTERS.map((letter, i) => {
                        const active = isTaskOnDay(task.id, i);
                        return (
                          <button
                            key={i}
                            onClick={() => toggleTaskDay(task.id, i)}
                            className={cn(
                              "flex-1 py-1 rounded-md text-xs font-semibold transition-all",
                              active
                                ? "bg-primary text-white"
                                : "bg-surface-hover text-muted hover:text-foreground hover:bg-surface-hover/80"
                            )}
                          >
                            {letter}
                          </button>
                        );
                      })}
                      <div className="flex-shrink-0 border-l border-border pl-1 ml-0.5 flex gap-0.5">
                        {([
                          { days: EVERYDAY, label: "All" },
                          { days: WEEKDAYS, label: "WD" },
                          { days: WEEKENDS, label: "WE" },
                        ] as const).map(({ days, label }) => {
                          const allOn = days.every((d) => isTaskOnDay(task.id, d));
                          return (
                            <button
                              key={label}
                              onClick={() => presetToggle(task.id, [...days])}
                              className={cn(
                                "px-1.5 py-1 rounded text-[10px] font-semibold transition-colors",
                                allOn
                                  ? "bg-primary/15 text-primary"
                                  : "text-muted hover:text-foreground"
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Schedule config panel */}
                  {isExpanded && config && (() => {
                    const mode: "none" | "deadline" | "window" =
                      config.window_start != null || config.window_end != null
                        ? "window"
                        : config.deadline_time != null
                          ? "deadline"
                          : "none";
                    return (
                      <div className="mx-2 mt-1 mb-1 p-3 rounded-lg bg-surface border border-border space-y-3">
                        <label className="block text-xs font-medium text-muted">Time Constraint</label>
                        {/* Mode toggle */}
                        <div className="flex rounded-lg overflow-hidden border border-border">
                          <button
                            onClick={() =>
                              updateTaskConfig(task.id, {
                                deadline_time: null,
                                window_start: null,
                                window_end: null,
                                time_strict: false,
                              })
                            }
                            className={cn(
                              "flex-1 py-1.5 text-xs font-medium transition-colors",
                              mode === "none"
                                ? "bg-primary text-white"
                                : "text-muted hover:text-foreground"
                            )}
                          >
                            None
                          </button>
                          <button
                            onClick={() => {
                              if (mode !== "deadline") {
                                updateTaskConfig(task.id, {
                                  deadline_time: config.window_start || config.window_end || "",
                                  window_start: null,
                                  window_end: null,
                                });
                              }
                            }}
                            className={cn(
                              "flex-1 py-1.5 text-xs font-medium transition-colors",
                              mode === "deadline"
                                ? "bg-primary text-white"
                                : "text-muted hover:text-foreground"
                            )}
                          >
                            Deadline
                          </button>
                          <button
                            onClick={() => {
                              if (mode !== "window") {
                                updateTaskConfig(task.id, {
                                  window_start: config.deadline_time || "",
                                  window_end: null,
                                  deadline_time: null,
                                });
                              }
                            }}
                            className={cn(
                              "flex-1 py-1.5 text-xs font-medium transition-colors",
                              mode === "window"
                                ? "bg-primary text-white"
                                : "text-muted hover:text-foreground"
                            )}
                          >
                            Window
                          </button>
                        </div>

                        {/* Time inputs — only for deadline or window */}
                        {mode === "deadline" && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">By</span>
                            <input
                              type="time"
                              value={config.deadline_time || ""}
                              onChange={(e) =>
                                updateTaskConfig(task.id, { deadline_time: e.target.value || null })
                              }
                              className="flex-1 px-2 py-1.5 rounded-md bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </div>
                        )}

                        {mode === "window" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={config.window_start || ""}
                              onChange={(e) =>
                                updateTaskConfig(task.id, { window_start: e.target.value || null })
                              }
                              className="flex-1 px-2 py-1.5 rounded-md bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <span className="text-xs text-muted">to</span>
                            <input
                              type="time"
                              value={config.window_end || ""}
                              onChange={(e) =>
                                updateTaskConfig(task.id, { window_end: e.target.value || null })
                              }
                              className="flex-1 px-2 py-1.5 rounded-md bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </div>
                        )}

                        {/* Strict/Soft toggle — only when a time is set */}
                        {mode !== "none" && (
                          <div className="flex rounded-lg overflow-hidden border border-border">
                            <button
                              onClick={() => updateTaskConfig(task.id, { time_strict: false })}
                              className={cn(
                                "flex-1 py-1.5 text-xs font-medium transition-colors",
                                !config.time_strict
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted hover:text-foreground"
                              )}
                            >
                              Soft (warning)
                            </button>
                            <button
                              onClick={() => updateTaskConfig(task.id, { time_strict: true })}
                              className={cn(
                                "flex-1 py-1.5 text-xs font-medium transition-colors",
                                config.time_strict
                                  ? "bg-danger/10 text-danger"
                                  : "text-muted hover:text-foreground"
                              )}
                            >
                              Strict (locks)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Saving..." : "Save Template"}
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
