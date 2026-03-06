"use client";

import { useState, useTransition } from "react";
import { setRating, toggleCompletion, setQualityRating, toggleQualityCheckbox, updateQualityTags } from "@/actions/completions";
import Card from "@/components/ui/Card";
import type { ResolvedTask } from "@/lib/resolveTemplate";
import { getTimeState, getScheduleLabel } from "@/lib/schedule";
import { cn } from "@/lib/utils";

interface MultiQualityTaskProps {
  task: ResolvedTask;
  date: string;
}

export default function MultiQualityTask({ task, date }: MultiQualityTaskProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const mainIsRating = task.rating_max > 0;
  const mainCompleted = mainIsRating
    ? task.completion?.rating != null
    : task.completion?.completed ?? false;

  const qualityCompletedCount = task.qualityCompletions.filter((qc) => {
    const quality = task.qualities.find((q) => q.id === qc.quality_id);
    if (!quality) return false;
    if (quality.type === "checkbox") return qc.completed;
    return qc.rating != null;
  }).length;

  const totalItems = 1 + task.qualities.length;
  const completedCount = (mainCompleted ? 1 : 0) + qualityCompletedCount;
  const allDone = completedCount === totalItems;
  const hasAny = completedCount > 0;
  const progress = totalItems > 0 ? completedCount / totalItems : 0;

  const timeState = getTimeState(task.schedule);
  const isLocked = timeState === "locked" && !allDone;
  const isOverdue = timeState === "overdue";
  const isUpcoming = timeState === "upcoming";
  const scheduleLabel = getScheduleLabel(task.schedule, timeState);

  function handleAction(action: () => Promise<void>) {
    if (isLocked) return;
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleMainToggle() {
    handleAction(() => toggleCompletion(task.id, date));
  }

  function handleMainRate(value: number) {
    handleAction(() => setRating(task.id, date, value));
  }

  function handleQualityRate(qualityId: string, value: number) {
    handleAction(() => setQualityRating(task.id, date, qualityId, value));
  }

  function handleQualityToggle(qualityId: string) {
    handleAction(() => toggleQualityCheckbox(task.id, date, qualityId));
  }

  function getQualityCompletion(qualityId: string) {
    return task.qualityCompletions.find((c) => c.quality_id === qualityId) ?? null;
  }

  // Build all items: main + sub-qualities
  const allItems = [
    { id: "__main__", name: task.name, isMain: true, type: mainIsRating ? "rating" as const : "checkbox" as const, ratingMax: task.rating_max, tags: [] as string[] },
    ...task.qualities.map((q) => ({ id: q.id, name: q.name, isMain: false, type: q.type as "checkbox" | "rating", ratingMax: q.rating_max, tags: q.tags ?? [] })),
  ];

  function isItemDone(item: typeof allItems[0]) {
    if (item.isMain) return mainCompleted;
    const qc = getQualityCompletion(item.id);
    if (item.type === "checkbox") return qc?.completed ?? false;
    return qc?.rating != null;
  }

  function getItemRating(item: typeof allItems[0]) {
    if (item.isMain) return task.completion?.rating ?? null;
    const qc = getQualityCompletion(item.id);
    return qc?.rating ?? null;
  }

  function getSelectedTags(qualityId: string): string[] {
    const qc = getQualityCompletion(qualityId);
    return qc?.selected_tags ?? [];
  }

  function handleTagToggle(qualityId: string, tag: string) {
    const current = getSelectedTags(qualityId);
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    handleAction(() => updateQualityTags(task.id, date, qualityId, next));
  }

  return (
    <Card
      className={cn(
        "transition-all !p-0 overflow-hidden",
        isLocked
          ? "opacity-50 border-border"
          : allDone
            ? "border-success/30"
            : isOverdue
              ? "border-warning/30"
              : hasAny
                ? "border-warning/30"
                : ""
      )}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => !isLocked && setExpanded(!expanded)}
        className={cn("w-full flex items-center gap-3 p-3.5 text-left", isLocked && "cursor-not-allowed")}
      >
        {/* Progress ring */}
        <div className="relative flex-shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              className="stroke-border"
              strokeWidth="3"
            />
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              className={cn(allDone ? "stroke-success" : "stroke-primary")}
              strokeWidth="3"
              strokeDasharray={`${progress * 94.2} 94.2`}
              strokeLinecap="round"
            />
          </svg>
          <span className={cn(
            "absolute inset-0 flex items-center justify-center text-[10px] font-bold",
            allDone ? "text-success" : hasAny ? "text-primary" : "text-muted"
          )}>
            {completedCount}/{totalItems}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {task.color && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.color }}
              />
            )}
            <span className={cn("text-sm font-semibold truncate", allDone && "text-success", isLocked && "text-muted")}>{task.name}</span>
            {isLocked && (
              <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            )}
            {isPending && (
              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
            )}
          </div>
          {scheduleLabel && !allDone && (
            <span className={cn(
              "text-[11px]",
              isLocked ? "text-muted" : isOverdue ? "text-warning" : "text-muted"
            )}>
              {scheduleLabel}
            </span>
          )}
          {/* Mini status dots */}
          <div className="flex gap-1 mt-1.5">
            {allItems.map((item) => {
              const done = isItemDone(item);
              const rating = item.type === "rating" ? getItemRating(item) : null;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    item.isMain ? "w-6" : "w-4",
                    done
                      ? allDone ? "bg-success" : "bg-primary"
                      : "bg-border"
                  )}
                  title={`${item.name}${rating != null ? `: ${rating}` : done ? ": done" : ""}`}
                />
              );
            })}
          </div>
        </div>

        <svg
          className={cn(
            "w-4 h-4 text-muted transition-transform flex-shrink-0",
            expanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-1">
          {allItems.map((item) => {
            const done = isItemDone(item);
            const rating = item.type === "rating" ? getItemRating(item) : null;

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-lg p-2.5 transition-colors",
                  done ? "bg-success/8" : "bg-surface-hover/50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Left: name + type indicator */}
                  <div className="flex items-center gap-2 min-w-0">
                    {item.type === "checkbox" ? (
                      <button
                        onClick={() => item.isMain ? handleMainToggle() : handleQualityToggle(item.id)}
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                          done
                            ? "bg-success border-success scale-105"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {done && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ) : (
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                        done ? "bg-primary text-white" : "bg-border/50 text-muted"
                      )}>
                        {rating ?? "-"}
                      </div>
                    )}
                    <span className={cn(
                      "text-sm truncate",
                      item.isMain && "font-medium",
                      done && item.type === "checkbox" && "line-through text-muted"
                    )}>
                      {item.name}
                    </span>
                  </div>
                </div>

                {/* Rating scale — inline pill selector */}
                {item.type === "rating" && (
                  <div className="flex gap-1 mt-2 ml-7">
                    {Array.from({ length: item.ratingMax }, (_, i) => i + 1).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => item.isMain ? handleMainRate(v) : handleQualityRate(item.id, v)}
                        className={cn(
                          "h-7 rounded-md text-xs font-medium transition-all flex-1 min-w-0",
                          rating === v
                            ? "bg-primary text-white shadow-sm scale-105"
                            : "bg-surface hover:bg-primary/10 text-muted hover:text-primary"
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}

                {/* Tag chips */}
                {!item.isMain && item.tags.length > 0 && (() => {
                  const selected = getSelectedTags(item.id);
                  return (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
                      {item.tags.map((tag) => {
                        const isSelected = selected.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagToggle(item.id, tag)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                              isSelected
                                ? "bg-primary/15 border-primary/40 text-primary"
                                : "bg-transparent border-border text-muted hover:border-primary/30 hover:text-primary/70"
                            )}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
