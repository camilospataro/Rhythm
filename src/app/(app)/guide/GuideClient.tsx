"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { enterAdminMode } from "@/actions/admin";
import { importWithAI } from "@/actions/import";

export default function GuideClient() {
  const router = useRouter();
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importInstructions, setImportInstructions] = useState("");
  const [importPending, startImportTransition] = useTransition();
  const [importResult, setImportResult] = useState<{ tasksCreated: number; templateCreated: string | null; errors: string[] } | null>(null);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {/* Header */}
      <header className="bg-surface glass border-b border-border shadow-[var(--glass-shadow)]">
        <div className="px-4 max-w-lg mx-auto text-center h-14 flex flex-col items-center justify-center">
          <h1 className="text-base font-semibold tracking-tight">Guide</h1>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-4 pb-8">
        {/* Welcome */}
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Welcome to Rhythm
          </h2>
          <p className="text-muted text-sm mt-2 max-w-xs mx-auto">
            Build consistent habits by tracking what matters to you, one day at a time.
          </p>
        </div>

        {/* How It Works */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">How It Works</h3>
              <p className="text-xs text-muted leading-relaxed">
                Rhythm follows a simple flow: <strong>create tasks</strong>, <strong>group them into templates</strong>, and <strong>assign templates to your weeks</strong>. Each day, check off what you&apos;ve done and rate your performance.
              </p>
            </div>
          </div>
        </Card>

        {/* Tasks */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Tasks</h3>
              <p className="text-xs text-muted leading-relaxed mb-2">
                Tasks are the building blocks of your routine. Go to the <strong>Tasks</strong> tab to create them.
              </p>
              <ul className="space-y-1.5 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Checkbox tasks</strong> — simple yes/no completion (e.g., &quot;Take vitamins&quot;)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Multi-quality tasks</strong> — rate yourself on a scale (e.g., &quot;Workout&quot; rated 1-5) with optional sub-qualities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Colors</strong> — assign a color to each task for easy identification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Time constraints</strong> — optionally set a time window (e.g., 6:00 AM - 8:00 AM)</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Templates */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-warning" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Templates</h3>
              <p className="text-xs text-muted leading-relaxed mb-2">
                Templates define your weekly routine. Each template contains tasks assigned to specific days of the week.
              </p>
              <ul className="space-y-1.5 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Go to <strong>Tasks → Templates</strong> to create one</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Add tasks and choose which days they repeat (Mon, Tue, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Set one template as <strong>default</strong> — it applies to all weeks automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Override specific weeks with different templates when your schedule changes</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Day View */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Day View</h3>
              <p className="text-xs text-muted leading-relaxed mb-2">
                Your daily dashboard. This is where you track your habits each day.
              </p>
              <ul className="space-y-1.5 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Check off</strong> tasks as you complete them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Rate</strong> multi-quality tasks on your defined scale</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Add standalone tasks</strong> — one-off tasks for just that day (won&apos;t affect your template)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Navigate between days with the <strong>arrow buttons</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Week View */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-light/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-primary-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Week View</h3>
              <p className="text-xs text-muted leading-relaxed mb-2">
                See your entire week at a glance with completion stats for each day.
              </p>
              <ul className="space-y-1.5 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>View which tasks are done across all 7 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong>Assign a template</strong> to any week using the template selector</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Tap any day to jump to its <strong>Day View</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Month View */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Month View</h3>
              <p className="text-xs text-muted leading-relaxed mb-2">
                A bird&apos;s-eye view of your entire month.
              </p>
              <ul className="space-y-1.5 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Each day shows a <strong>completion percentage</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Weeks are <strong>color-coded</strong> by their assigned template</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Navigate between months to review past performance</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Trends */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Trends</h3>
              <p className="text-xs text-muted leading-relaxed">
                Track your progress over the last <strong>90 days</strong> with charts that show your completion rates and quality ratings over time. Great for spotting patterns and staying motivated.
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Tips */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Quick Tips</h3>
              <ul className="space-y-1.5 text-xs text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Start small — add just 3-5 tasks to build the habit of tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Create a <strong>default template</strong> for your standard week</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Use <strong>standalone tasks</strong> for one-off items without changing your template</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Check <strong>Trends</strong> weekly to see how consistent you&apos;ve been</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Use different templates for busy vs. relaxed weeks</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* AI Import */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Import with AI</h3>
              <p className="text-xs text-muted leading-relaxed mb-3">
                Upload a file with your routine, schedule, or habit list and AI will set up your tasks and templates automatically.
              </p>

              {!showImport ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImport(true)}
                >
                  Import a file
                </Button>
              ) : (
                <div className="space-y-3">
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
                    placeholder="Optional instructions (e.g., &quot;Only import weekday tasks&quot;, &quot;Rate workouts on a scale of 1-10&quot;)"
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

                  {/* Loading indicator */}
                  {importPending && (
                    <p className="text-xs text-muted text-center animate-pulse">
                      AI is analyzing your file and creating tasks...
                    </p>
                  )}

                  {/* Result */}
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
                      <button
                        onClick={() => router.push("/tasks")}
                        className="text-xs text-primary font-medium hover:underline mt-1"
                      >
                        View tasks →
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {importError && (
                    <p className="text-xs text-danger">{importError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Get Started Button */}
        <div className="pt-2 pb-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => router.push("/tasks")}
          >
            Get Started
          </Button>
          <p className="text-center text-xs text-muted mt-3">
            Head to Tasks to create your first task and template.
          </p>
        </div>

        {/* Admin Entry */}
        <div className="flex flex-col items-center pb-28 gap-2 mt-6">
          {!showAdminInput ? (
            <button
              onClick={() => setShowAdminInput(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-primary border border-border hover:border-primary/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Admin
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAdminError("");
                startTransition(async () => {
                  try {
                    await enterAdminMode(adminPassword);
                    setAdminPassword("");
                    setShowAdminInput(false);
                    router.push("/admin");
                  } catch (err) {
                    setAdminError(err instanceof Error ? err.message : "Error");
                  }
                });
              }}
              className="flex items-center gap-2"
            >
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Password"
                className="w-32 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <button
                type="submit"
                disabled={isPending || !adminPassword}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {isPending ? "..." : "Go"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAdminInput(false); setAdminError(""); setAdminPassword(""); }}
                className="text-muted hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          )}
          {adminError && (
            <p className="text-xs text-danger">{adminError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
