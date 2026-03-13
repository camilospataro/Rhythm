"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TaskForm from "@/components/tasks/TaskForm";
import { createTask, deleteTask } from "@/actions/tasks";
import { createTemplate } from "@/actions/templates";
import { importWithAI } from "@/actions/import";
import { TASK_TYPES, type TaskType } from "@/lib/constants";
import type { Task, WeekTemplate } from "@/types/database";

interface TaskListClientProps {
  tasks: Task[];
  templates: WeekTemplate[];
}

export default function TaskListClient({ tasks, templates }: TaskListClientProps) {
  const router = useRouter();
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importInstructions, setImportInstructions] = useState("");
  const [importPending, startImportTransition] = useTransition();
  const [importResult, setImportResult] = useState<{ tasksCreated: number; templateCreated: string | null; errors: string[] } | null>(null);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCreateTask(data: {
    name: string;
    type: TaskType;
    color?: string;
  }) {
    const task = await createTask(data);
    setShowNewTask(false);
    if (data.type === "multi_quality") {
      router.push(`/tasks/${task.id}`);
    }
  }

  async function handleCreateTemplate() {
    if (!templateName.trim()) return;
    setTemplateLoading(true);
    try {
      await createTemplate(templateName.trim(), templates.length === 0);
      setTemplateName("");
      setShowNewTemplate(false);
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      {/* Tasks Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Tasks & Habits</h2>
          <Button size="sm" onClick={() => setShowNewTask(true)}>
            + New Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <Card>
            <p className="text-sm text-muted text-center py-4">
              No tasks yet. Create your first habit or tracker!
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Card key={task.id} className="flex items-center justify-between">
                <Link
                  href={`/tasks/${task.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-3">
                    {task.color && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: task.color }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{task.name}</p>
                      <p className="text-xs text-muted">
                        {TASK_TYPES[task.type as TaskType]}
                      </p>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 text-muted hover:text-danger transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Templates Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Week Templates</h2>
          <Button size="sm" onClick={() => setShowNewTemplate(true)}>
            + New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card>
            <p className="text-sm text-muted text-center py-4">
              No templates yet. Create a week template to assign tasks to days.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <Link key={template.id} href={`/tasks/templates/${template.id}`}>
                <Card className="flex items-center justify-between hover:bg-surface-hover transition-colors">
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    {template.is_default && (
                      <span className="text-xs text-primary">Default</span>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* AI Import */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Import with AI</h2>
          {!showImport && (
            <Button size="sm" onClick={() => setShowImport(true)}>
              Import a file
            </Button>
          )}
        </div>

        {showImport && (
          <Card>
            <div className="space-y-3">
              <p className="text-xs text-muted leading-relaxed">
                Upload a file with your routine, schedule, or habit list and AI will create tasks and a template automatically.
              </p>

              {/* File input */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.md,.json,.xlsx,.xls,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] || null);
                    setImportResult(null);
                    setImportError("");
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-xs truncate">
                    {importFile ? importFile.name : "Choose a file..."}
                  </span>
                </button>
              </div>

              {/* Instructions */}
              <textarea
                value={importInstructions}
                onChange={(e) => setImportInstructions(e.target.value)}
                placeholder="Optional instructions (e.g., &quot;Only import weekday tasks&quot;, &quot;Rate workouts 1-10&quot;)"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-muted/60"
              />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  disabled={!importFile || importPending}
                  onClick={() => {
                    if (!importFile) return;
                    setImportError("");
                    setImportResult(null);
                    startImportTransition(async () => {
                      try {
                        const text = await importFile.text();
                        const result = await importWithAI(text, importFile.name, importInstructions);
                        setImportResult(result);
                        if (result.tasksCreated > 0) {
                          setImportFile(null);
                          setImportInstructions("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }
                      } catch (err) {
                        setImportError(err instanceof Error ? err.message : "Import failed");
                      }
                    });
                  }}
                >
                  {importPending ? "Importing..." : "Import"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowImport(false);
                    setImportFile(null);
                    setImportInstructions("");
                    setImportResult(null);
                    setImportError("");
                  }}
                >
                  Cancel
                </Button>
              </div>

              {importPending && (
                <p className="text-xs text-muted text-center animate-pulse">
                  AI is analyzing your file and creating tasks...
                </p>
              )}

              {importResult && (
                <div className="rounded-lg bg-success/10 border border-success/20 p-3 space-y-1">
                  <p className="text-xs font-medium text-success">
                    Created {importResult.tasksCreated} task{importResult.tasksCreated !== 1 ? "s" : ""}
                    {importResult.templateCreated && ` and template "${importResult.templateCreated}"`}
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="text-xs text-warning">
                      {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                  )}
                </div>
              )}

              {importError && (
                <p className="text-xs text-danger">{importError}</p>
              )}
            </div>
          </Card>
        )}
      </section>

      {/* New Task Modal */}
      <Modal open={showNewTask} onClose={() => setShowNewTask(false)} title="New Task">
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowNewTask(false)}
        />
      </Modal>

      {/* New Template Modal */}
      <Modal
        open={showNewTemplate}
        onClose={() => setShowNewTemplate(false)}
        title="New Week Template"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Template Name</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Normal Week, Recovery Week"
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => e.key === "Enter" && handleCreateTemplate()}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateTemplate}
              disabled={templateLoading || !templateName.trim()}
              className="flex-1"
            >
              {templateLoading ? "Creating..." : "Create Template"}
            </Button>
            <Button variant="secondary" onClick={() => setShowNewTemplate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
