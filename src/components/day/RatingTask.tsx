"use client";

import { useTransition } from "react";
import { setRating } from "@/actions/completions";
import RatingInput from "@/components/ui/RatingInput";
import type { ResolvedTask } from "@/lib/resolveTemplate";
import Card from "@/components/ui/Card";

interface RatingTaskProps {
  task: ResolvedTask;
  date: string;
}

export default function RatingTask({ task, date }: RatingTaskProps) {
  const [isPending, startTransition] = useTransition();

  function handleRate(value: number) {
    startTransition(() => {
      setRating(task.id, date, value);
    });
  }

  return (
    <Card className={task.completion?.rating ? "border-primary/30 bg-primary/5" : ""}>
      <div className="flex items-center gap-2 mb-2">
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
      <RatingInput
        value={task.completion?.rating ?? null}
        onChange={handleRate}
        min={task.rating_min}
        max={task.rating_max}
      />
    </Card>
  );
}
