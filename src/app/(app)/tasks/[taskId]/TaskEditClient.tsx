"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { TASK_TYPES, type TaskType } from "@/lib/constants";
import type { Task, TaskQuality, QualityType } from "@/types/database";
import { updateTask, createTaskQuality, updateTaskQuality, deleteTaskQuality } from "@/actions/tasks";
import { cn } from "@/lib/utils";

interface TaskEditClientProps {
  task: Task;
  qualities: TaskQuality[];
}

export default function TaskEditClient({ task, qualities }: TaskEditClientProps) {
  const router = useRouter();

  const [name, setName] = useState(task.name);
  const [type, setType] = useState<TaskType>(task.type as TaskType);
  const [color, setColor] = useState(task.color || "#6366f1");
  const [mainQualityType, setMainQualityType] = useState<QualityType>(
    task.rating_max > 0 ? "rating" : "checkbox"
  );
  const [mainRatingMax, setMainRatingMax] = useState(task.rating_max || 5);
  const [saving, setSaving] = useState(false);

  // Editing quality
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<QualityType>("checkbox");
  const [editRatingMax, setEditRatingMax] = useState(5);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");

  // Adding quality
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<QualityType>("checkbox");
  const [newRatingMax, setNewRatingMax] = useState(5);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
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
      await createTaskQuality(
        task.id,
        newName.trim(),
        newType,
        newType === "rating" ? newRatingMax : 5,
        newTags
      );
      setNewName("");
      setNewType("checkbox");
      setNewRatingMax(5);
      setNewTags([]);
      setNewTagInput("");
      setShowAddForm(false);
    } finally {
      setAddingQuality(false);
    }
  }

  async function handleUpdateQuality(qualityId: string) {
    if (!editName.trim()) return;
    await updateTaskQuality(
      qualityId,
      editName.trim(),
      editType,
      editType === "rating" ? editRatingMax : 5,
      editTags
    );
    setEditingId(null);
  }

  async function handleDeleteQuality(qualityId: string) {
    if (confirm("Delete this quality?")) {
      await deleteTaskQuality(qualityId);
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Color accent bar */}
        <div className="h-1.5" style={{ backgroundColor: color }} />

        <div className="p-4 space-y-5">
          {/* Name & Color row */}
          <div className="flex gap-3 items-start">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border border-border flex-shrink-0 mt-0.5"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 text-lg font-semibold bg-transparent border-b-2 border-border focus:border-primary outline-none pb-1 transition-colors"
              placeholder="Task name..."
            />
          </div>

          {/* Type toggle */}
          <div className="flex rounded-xl bg-surface-hover p-1 gap-1">
            {(Object.entries(TASK_TYPES) as [TaskType, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setType(key)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  type === key
                    ? "bg-white dark:bg-surface shadow-sm text-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                {key === "checkbox" ? "Simple Checkbox" : "Multi-Quality"}
              </button>
            ))}
          </div>

          {/* Multi-quality configuration */}
          {type === "multi_quality" && (
            <div className="space-y-3">
              {/* Main quality row */}
              <div className="rounded-xl bg-surface-hover/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium">{name || "Main"}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted bg-surface px-1.5 py-0.5 rounded">main</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TypeToggle value={mainQualityType} onChange={setMainQualityType} />
                  {mainQualityType === "rating" && (
                    <ScaleInput value={mainRatingMax} onChange={setMainRatingMax} />
                  )}
                </div>
              </div>

              {/* Sub-qualities */}
              {qualities.map((q) => (
                <div key={q.id} className="rounded-xl bg-surface-hover/50 p-3">
                  {editingId === q.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateQuality(q.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <TypeToggle value={editType} onChange={setEditType} />
                        {editType === "rating" && (
                          <ScaleInput value={editRatingMax} onChange={setEditRatingMax} />
                        )}
                      </div>
                      <TagEditor
                        tags={editTags}
                        onChange={setEditTags}
                        tagInput={editTagInput}
                        onTagInputChange={setEditTagInput}
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdateQuality(q.id)}
                          className="text-xs font-medium text-primary hover:text-primary/80"
                        >
                          Save
                        </button>
                        <span className="text-border">|</span>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs font-medium text-muted hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {q.type === "checkbox" ? (
                            <div className="w-4 h-4 rounded border-2 border-border flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] font-bold text-primary">{q.rating_max}</span>
                            </div>
                          )}
                          <span className="text-sm">{q.name}</span>
                          <span className="text-[10px] text-muted">
                            {q.type === "checkbox" ? "check" : `1-${q.rating_max}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => {
                              setEditingId(q.id);
                              setEditName(q.name);
                              setEditType(q.type as QualityType);
                              setEditRatingMax(q.rating_max);
                              setEditTags(q.tags || []);
                              setEditTagInput("");
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteQuality(q.id)}
                            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {/* Show tags preview */}
                      {q.tags && q.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-6">
                          {q.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add quality */}
              {showAddForm ? (
                <div className="rounded-xl border-2 border-dashed border-primary/30 p-3 space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Quality name..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddQuality();
                      if (e.key === "Escape") { setShowAddForm(false); setNewName(""); }
                    }}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <TypeToggle value={newType} onChange={setNewType} />
                    {newType === "rating" && (
                      <ScaleInput value={newRatingMax} onChange={setNewRatingMax} />
                    )}
                  </div>
                  <TagEditor
                    tags={newTags}
                    onChange={setNewTags}
                    tagInput={newTagInput}
                    onTagInputChange={setNewTagInput}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddQuality}
                      disabled={addingQuality || !newName.trim()}
                      className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40"
                    >
                      {addingQuality ? "Adding..." : "Add"}
                    </button>
                    <span className="text-border">|</span>
                    <button
                      onClick={() => { setShowAddForm(false); setNewName(""); setNewTags([]); setNewTagInput(""); }}
                      className="text-xs font-medium text-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/40 p-3 text-sm text-muted hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Quality
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-2 mt-4">
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

/* Reusable inline components */

function TypeToggle({ value, onChange }: { value: QualityType; onChange: (v: QualityType) => void }) {
  return (
    <div className="flex rounded-lg bg-surface p-0.5 gap-0.5">
      <button
        type="button"
        onClick={() => onChange("checkbox")}
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
          value === "checkbox"
            ? "bg-primary text-white shadow-sm"
            : "text-muted hover:text-foreground"
        )}
      >
        Check
      </button>
      <button
        type="button"
        onClick={() => onChange("rating")}
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
          value === "rating"
            ? "bg-primary text-white shadow-sm"
            : "text-muted hover:text-foreground"
        )}
      >
        Rating
      </button>
    </div>
  );
}

function ScaleInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      <span>1 -</span>
      <input
        type="number"
        min={2}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-12 px-1.5 py-1 rounded-md border border-border text-xs text-center bg-surface"
      />
    </div>
  );
}

function TagEditor({
  tags,
  onChange,
  tagInput,
  onTagInputChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  tagInput: string;
  onTagInputChange: (v: string) => void;
}) {
  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
      onTagInputChange("");
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted mb-1 block">Tags (optional)</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-danger transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          placeholder="Add tag..."
          className="flex-1 px-2 py-1 rounded-md bg-surface border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addTag(); }
          }}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!tagInput.trim()}
          className="px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
