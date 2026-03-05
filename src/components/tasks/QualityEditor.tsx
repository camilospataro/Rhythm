"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { TaskQuality, QualityType } from "@/types/database";
import { QUALITY_TYPES } from "@/lib/constants";
import { createTaskQuality, deleteTaskQuality, updateTaskQuality } from "@/actions/tasks";

interface QualityEditorProps {
  taskId: string;
  qualities: TaskQuality[];
}

export default function QualityEditor({ taskId, qualities }: QualityEditorProps) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<QualityType>("checkbox");
  const [newRatingMax, setNewRatingMax] = useState(5);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<QualityType>("checkbox");
  const [editRatingMax, setEditRatingMax] = useState(5);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await createTaskQuality(taskId, newName.trim(), newType, newType === "rating" ? newRatingMax : 5);
      setNewName("");
      setNewType("checkbox");
      setNewRatingMax(5);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(qualityId: string) {
    if (!editName.trim()) return;
    await updateTaskQuality(qualityId, editName.trim(), editType, editType === "rating" ? editRatingMax : 5);
    setEditingId(null);
  }

  async function handleDelete(qualityId: string) {
    await deleteTaskQuality(qualityId);
  }

  return (
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
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate(q.id)}
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
                    <span className="text-xs text-muted">Scale: 1-</span>
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
                  <Button size="sm" onClick={() => handleUpdate(q.id)}>Save</Button>
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
                    onClick={() => handleDelete(q.id)}
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
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
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
            <span className="text-xs text-muted">Scale: 1-</span>
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
        <Button size="sm" onClick={handleAdd} disabled={loading || !newName.trim()}>
          {loading ? "Adding..." : "Add Quality"}
        </Button>
      </div>
    </div>
  );
}
