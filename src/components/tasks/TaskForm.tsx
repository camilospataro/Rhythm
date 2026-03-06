"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { TASK_TYPES, type TaskType } from "@/lib/constants";

interface TaskFormProps {
  initialData?: {
    name: string;
    type: TaskType;
    color: string;
  };
  onSubmit: (data: {
    name: string;
    type: TaskType;
    color?: string;
  }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Create Task",
}: TaskFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<TaskType>(initialData?.type || "checkbox");
  const [color, setColor] = useState(initialData?.color || "#6366f1");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, type, color });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="e.g., Morning Run, Mental Fog"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(TASK_TYPES) as [TaskType, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                type === key
                  ? "bg-primary text-white border-primary"
                  : "bg-surface border-border hover:bg-surface-hover"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-1.5">
          {type === "checkbox"
            ? "Simple on/off toggle for daily habits"
            : "Track multiple sub-qualities with checkboxes or ratings. You'll configure them next."}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Color</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-border"
          />
          <span className="text-sm text-muted">{color}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
          {loading ? "Saving..." : type === "multi_quality" ? "Create & Configure" : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
