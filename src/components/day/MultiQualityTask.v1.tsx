"use client";

import { useState, useTransition } from "react";
import { setRating, toggleCompletion, setQualityRating, toggleQualityCheckbox } from "@/actions/completions";
import RatingInput from "@/components/ui/RatingInput";
import Card from "@/components/ui/Card";
import type { ResolvedTask } from "@/lib/resolveTemplate";
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

  // Total = main quality + sub-qualities
  const totalItems = 1 + task.qualities.length;
  const completedCount = (mainCompleted ? 1 : 0) + qualityCompletedCount;
  const allDone = completedCount === totalItems;
  const hasAny = completedCount > 0;

  function handleMainToggle() {
    startTransition(() => {
      toggleCompletion(task.id, date);
    });
  }

  function handleMainRate(value: number) {
    startTransition(() => {
      setRating(task.id, date, value);
    });
  }

  function handleQualityRate(qualityId: string, value: number) {
    startTransition(() => {
      setQualityRating(task.id, date, qualityId, value);
    });
  }

  function handleQualityToggle(qualityId: string) {
    startTransition(() => {
      toggleQualityCheckbox(task.id, date, qualityId);
    });
  }

  function getQualityCompletion(qualityId: string) {
    return task.qualityCompletions.find((c) => c.quality_id === qualityId) ?? null;
  }

  return (
    <Card
      className={cn(
        "transition-all",
        allDone ? "border-success/30 bg-success/5" : hasAny ? "border-warning/30 bg-warning/5" : ""
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {task.color && (
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: task.color }}
            />
          )}
          <span className="text-sm font-medium">{task.name}</span>
          {isPending && (
            <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasAny && (
            <span className="text-xs text-muted">
              {completedCount}/{totalItems}
            </span>
          )}
          <svg
            className={cn(
              "w-4 h-4 text-muted transition-transform",
              expanded && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 pt-3 border-t border-border">
          {/* Main quality */}
          {mainIsRating ? (
            <div>
              <p className="text-xs text-muted mb-1.5">{task.name}</p>
              <RatingInput
                value={task.completion?.rating ?? null}
                onChange={handleMainRate}
                min={1}
                max={task.rating_max}
                size="sm"
              />
            </div>
          ) : (
            <button
              onClick={handleMainToggle}
              className="w-full flex items-center gap-2.5 text-left"
            >
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                  mainCompleted
                    ? "bg-success border-success"
                    : "border-border"
                )}
              >
                {mainCompleted && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span className={cn("text-sm font-medium", mainCompleted && "line-through text-muted")}>
                {task.name}
              </span>
            </button>
          )}

          {/* Sub-qualities */}
          {task.qualities.length === 0 ? (
            <p className="text-xs text-muted">
              No sub-qualities defined. Add them in the Task Manager.
            </p>
          ) : (
            task.qualities.map((quality) => {
              const qc = getQualityCompletion(quality.id);

              if (quality.type === "checkbox") {
                const isChecked = qc?.completed ?? false;
                return (
                  <button
                    key={quality.id}
                    onClick={() => handleQualityToggle(quality.id)}
                    className="w-full flex items-center gap-2.5 text-left"
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                        isChecked
                          ? "bg-success border-success"
                          : "border-border"
                      )}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <span className={cn("text-sm", isChecked && "line-through text-muted")}>
                      {quality.name}
                    </span>
                  </button>
                );
              }

              // Rating quality
              return (
                <div key={quality.id}>
                  <p className="text-xs text-muted mb-1.5">{quality.name}</p>
                  <RatingInput
                    value={qc?.rating ?? null}
                    onChange={(v) => handleQualityRate(quality.id, v)}
                    min={1}
                    max={quality.rating_max}
                    size="sm"
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
}
