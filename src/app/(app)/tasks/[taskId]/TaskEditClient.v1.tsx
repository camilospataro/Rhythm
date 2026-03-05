"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TASK_TYPES, QUALITY_TYPES, type TaskType } from "@/lib/constants";
import type { Task, TaskQuality, QualityType } from "@/types/database";
import { updateTask, createTaskQuality, updateTaskQuality, deleteTaskQuality } from "@/actions/tasks";

interface TaskEditClientProps {
  task: Task;
  qualities: TaskQuality[];
}

export default function TaskEditClient({ task, qualities }: TaskEditClientProps) {
  const router = useRouter();

  // Main task fields
  const [name, setName] = useState(task.name);
  const [type, setType] = useState<TaskType>(task.type as TaskType);
  const [color, setColor] = useState(task.color || "#6366f1");
  const [mainQualityType, setMainQualityType] = useState<QualityType>(
    task.rating_max > 0 ? "rating" : "checkbox"
  );
  const [mainRatingMax, setMainRatingMax] = useState(task.rating_max || 5);
  const [saving, setSaving] = useState(false);

  // Quality editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<QualityType>("checkbox");
  const [editRatingMax, setEditRatingMax] = useState(5);

  // New quality
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<QualityType>("checkbox");
  const [newRatingMax, setNewRatingMax] = useState(5);
  const [addingQuality, setAddingQuality] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateTask(task.id, {
        name: name.trim(),
        type,
        color,
        rating_max: type === "multi_quality" && mainQualityType === "rating" ? mainRatingMax : 0,
      });
      router.push("/tasks");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddQuality() {
    if (!newName.trim()) return;
    setAddingQuality(true);
    try {
      await createTaskQuality(taskId(), newName.trim(), newType, newType === "rating" ? newRatingMax : 5);
      setNewName("");
      setNewType("checkbox");
      setNewRatingMax(5);
    } finally {
      setAddingQuality(false);
    }
  }

  async function handleUpdateQuality(qualityId: string) {
    if (!editName.trim()) return;
    await updateTaskQuality(qualityId, editName.trim(), editType, editType === "rating" ? editRatingMax : 5);
    setEditingId(null);
  }

  async function handleDeleteQuality(qualityId: string) {
    if (confirm("Delete this quality?")) {
      await deleteTaskQuality(qualityId);
    }
  }

  function taskId() {
    return task.id;
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <Card>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g., Morning Run, Mental Fog"
            />
          </div>

          {/* Type */}
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
                : "Track multiple sub-qualities, each with its own checkbox or rating scale"}
            </p>
          </div>

          {/* Main Quality Type (for multi_quality) */}
          {type === "multi_quality" && (
            <div>
              <label className="block text-sm font-medium mb-1">Main Rating</label>
              <p className="text-xs text-muted mb-2">
                How the main task itself is tracked (in addition to sub-qualities).
              </p>
              <div className="flex gap-1.5">
                {(Object.entries(QUALITY_TYPES) as [QualityType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMainQualityType(key)}
                    className={`py-1.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      mainQualityType === key
                        ? "bg-primary text-white border-primary"
                        : "bg-surface border-border hover:bg-surface-hover"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mainQualityType === "rating" && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted">Scale: 1 -</span>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={mainRatingMax}
                    onChange={(e) => setMainRatingMax(Number(e.target.value))}
                    className="w-14 px-2 py-1 rounded border border-border text-sm text-center"
                  />
                </div>
              )}
            </div>
          )}

          {/* Color */}
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
        </div>
      </Card>

      {/* Sub-Qualities Section */}
      {type === "multi_quality" && (
        <Card>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Sub-Qualities</h3>
            <p className="text-xs text-muted">
              Add qualities to track individually. Each can be a checkbox or a rating scale.
            </p>

            <div className="space-y-2">
              {qualities.map((q) => (
                <div key={q.id} className="border border-border rounded-lg p-2.5">
                  {editingId === q.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateQuality(q.id)}
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        {(Object.entries(QUALITY_TYPES) as [QualityType, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setEditType(key)}
                            className={`py-1 px-2.5 rounded text-xs font-medium border transition-colors ${
                              editType === key
                                ? "bg-primary text-white border-primary"
                                : "bg-surface border-border"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {editType === "rating" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">Scale: 1 -</span>
                          <input
                            type="number"
                            min={2}
                            max={10}
                            value={editRatingMax}
                            onChange={(e) => setEditRatingMax(Number(e.target.value))}
                            className="w-14 px-2 py-1 rounded border border-border text-sm text-center"
                          />
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => handleUpdateQuality(q.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm">{q.name}</span>
                        <span className="text-xs text-muted ml-2">
                          {q.type === "checkbox" ? "Checkbox" : `Rating (1-${q.rating_max})`}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(q.id);
                            setEditName(q.name);
                            setEditType(q.type as QualityType);
                            setEditRatingMax(q.rating_max);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger"
                          onClick={() => handleDeleteQuality(q.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new quality */}
            <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New quality name..."
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddQuality()}
              />
              <div className="flex gap-1.5">
                {(Object.entries(QUALITY_TYPES) as [QualityType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewType(key)}
                    className={`py-1 px-2.5 rounded text-xs font-medium border transition-colors ${
                      newType === key
                        ? "bg-primary text-white border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {newType === "rating" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Scale: 1 -</span>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={newRatingMax}
                    onChange={(e) => setNewRatingMax(Number(e.target.value))}
                    className="w-14 px-2 py-1 rounded border border-border text-sm text-center"
                  />
                </div>
              )}
              <Button size="sm" onClick={handleAddQuality} disabled={addingQuality || !newName.trim()}>
                {addingQuality ? "Adding..." : "Add Quality"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="secondary" onClick={() => router.push("/tasks")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
