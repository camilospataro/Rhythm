"use client";

import { cn } from "@/lib/utils";

interface RatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export default function RatingInput({
  value,
  onChange,
  min = 1,
  max = 5,
  size = "md",
}: RatingInputProps) {
  const ratings = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="flex gap-1.5">
      {ratings.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "rounded-full font-medium transition-all",
            size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm",
            value === r
              ? "bg-primary text-white scale-110"
              : "bg-surface-hover text-muted hover:bg-primary/20 hover:text-primary"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
