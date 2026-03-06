"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignWeek, unassignWeek } from "@/actions/templates";
import Button from "@/components/ui/Button";
import { getWeekNumber, getWeekYear } from "@/lib/dates";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/layout/LogoutButton";
import AdminButton from "@/components/layout/AdminButton";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  format,
} from "date-fns";

interface TemplateOption {
  id: string;
  name: string;
  is_default: boolean;
}

interface WeekInfo {
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  assignedTemplateId: string | null;
  isExplicit: boolean;
}

interface MonthClientProps {
  monthName: string;
  year: number;
  month: number;
  dailySummary: Record<string, { completed: number; total: number }>;
  templates: TemplateOption[];
  weekInfos: WeekInfo[];
  isAdmin?: boolean;
  impersonatingEmail?: string | null;
}

export default function MonthClient({ monthName, year, month, dailySummary, templates, weekInfos, isAdmin: admin, impersonatingEmail }: MonthClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const date = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const defaultTemplate = templates.find((t) => t.is_default);

  // Generate consistent HSL color per template
  function getTemplateColor(templateId: string | null): string {
    if (!templateId) return "hsl(0, 0%, 70%)";
    let hash = 0;
    for (let i = 0; i < templateId.length; i++) {
      hash = templateId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = ((hash % 360) + 360) % 360;
    return `hsl(${hue}, 60%, 55%)`;
  }

  // Map week number -> weekInfo for calendar matching
  const weekInfoMap = new Map(
    weekInfos.map((w) => [`${w.year}-${w.weekNumber}`, w])
  );

  // Build calendar grid
  const days: Date[] = [];
  let current = calStart;
  while (current <= calEnd) {
    days.push(current);
    current = addDays(current, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  function navigate(offset: number) {
    let newMonth = month + offset;
    let newYear = year;
    if (newMonth < 1) {
      newYear--;
      newMonth = 12;
    } else if (newMonth > 12) {
      newYear++;
      newMonth = 1;
    }
    router.push(`/month?year=${newYear}&month=${newMonth}`);
  }

  function handleWeekChange(weekInfo: WeekInfo, templateId: string) {
    startTransition(async () => {
      try {
        if (templateId === "__default__") {
          await unassignWeek(weekInfo.year, weekInfo.weekNumber);
        } else {
          await assignWeek(weekInfo.year, weekInfo.weekNumber, templateId);
        }
        router.refresh();
      } catch (err) {

        alert(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleSetAll(templateId: string) {
    startTransition(async () => {
      try {
        for (const w of weekInfos) {
          if (templateId === "__default__") {
            await unassignWeek(w.year, w.weekNumber);
          } else {
            await assignWeek(w.year, w.weekNumber, templateId);
          }
        }
        router.refresh();
      } catch (err) {

        alert(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div>
      {/* Logo Header */}
      <header className="bg-surface glass border-b border-border shadow-[var(--glass-shadow)]">
        <div className="px-4 max-w-lg mx-auto h-14 flex items-center">
          <div className="w-[4.5rem] flex-shrink-0">
            {admin && <AdminButton impersonatingEmail={impersonatingEmail} />}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Image src="/logo.png" alt="Rhythm" width={100} height={32} className="h-7 w-auto dark:invert" priority />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              href="/guide"
              className="w-8 h-8 rounded-full border border-border bg-surface-hover flex items-center justify-center text-muted hover:text-primary hover:border-primary/30 transition-colors"
              aria-label="Help & Guide"
              title="Help & Guide"
            >
              <span className="text-xs font-semibold">?</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Button>
        <button onClick={() => router.push("/month")} className="text-center flex flex-col items-center">
          <span className="text-sm font-semibold">{monthName}</span>
          {isCurrentMonth && (
            <span className="text-[10px] text-primary font-medium">Current Month</span>
          )}
        </button>
        <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Button>
      </div>

      {/* Day Headers */}
      <div className="flex gap-1 mb-1">
        <div className="w-1 flex-shrink-0" />
        <div className="grid grid-cols-7 gap-1 flex-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs text-muted font-medium py-1">
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {weeks.map((weekDays, wi) => {
          const monday = weekDays[0];
          const wy = getWeekYear(monday);
          const wn = getWeekNumber(monday);
          const weekKey = `${wy}-${wn}`;
          const info = weekInfoMap.get(weekKey);
          const isExplicit = info?.isExplicit ?? false;
          const templateColor = isExplicit ? getTemplateColor(info!.assignedTemplateId) : undefined;
          const template = isExplicit ? templates.find((t) => t.id === info!.assignedTemplateId) : undefined;

          // Build a subtle background from the template color (shift lightness to 93%)
          const weekBg = templateColor
            ? templateColor.replace(/55%\)$/, "93%)")
            : undefined;

          return (
            <div
              key={wi}
              className="flex gap-1 rounded-lg py-0.5 px-1"
              style={{ backgroundColor: weekBg || "transparent" }}
              title={template?.name || "No template"}
            >
              {/* Template color indicator */}
              <div
                className="w-1 rounded-full flex-shrink-0 my-0.5"
                style={{ backgroundColor: templateColor || "transparent" }}
              />
              <div className="grid grid-cols-7 gap-1 flex-1">
                {weekDays.map((day, di) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const inMonth = isSameMonth(day, date);
                  const today = isToday(day);
                  const summary = dailySummary[dateStr];

                  let bgColor = "";
                  if (summary && summary.total > 0) {
                    const pct = summary.completed / summary.total;
                    if (pct >= 1) bgColor = "bg-success/20";
                    else if (pct >= 0.5) bgColor = "bg-warning/20";
                    else if (pct > 0) bgColor = "bg-danger/20";
                  }

                  return (
                    <button
                      key={di}
                      onClick={() => router.push(`/day?date=${dateStr}`)}
                      className={cn(
                        "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative",
                        !inMonth && "opacity-30",
                        today && "ring-2 ring-primary",
                        bgColor || "hover:bg-surface-hover"
                      )}
                    >
                      <span className={cn("font-medium", today && "text-primary")}>
                        {format(day, "d")}
                      </span>
                      {summary && summary.total > 0 && (
                        <span className="text-[10px] text-muted">
                          {summary.completed}/{summary.total}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center mt-4 text-xs text-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-success/20" />
          <span>100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-warning/20" />
          <span>50%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-danger/20" />
          <span>&lt;50%</span>
        </div>
      </div>

      {/* Template Color Legend */}
      {templates.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 justify-center mt-2 text-xs text-muted">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getTemplateColor(t.id) }}
              />
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Templates */}
      {templates.length > 0 && (
        <div className={cn("mt-6", isPending && "opacity-50 pointer-events-none")}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium">Weekly Templates</h3>
            {isPending && (
              <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            )}
          </div>

          <div className="space-y-2">
            {weekInfos.map((w) => {
              const template = templates.find((t) => t.id === w.assignedTemplateId);
              return (
                <div
                  key={`${w.year}-${w.weekNumber}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted">
                      Wk {w.weekNumber} · {w.startDate}–{w.endDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!w.isExplicit && (
                      <span className="text-[10px] text-muted bg-surface-hover px-1.5 py-0.5 rounded">default</span>
                    )}
                    <select
                      value={w.isExplicit ? (w.assignedTemplateId || "") : "__default__"}
                      onChange={(e) => handleWeekChange(w, e.target.value)}
                      className="text-sm bg-surface-hover border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50 max-w-[140px] truncate"
                    >
                      <option value="__default__">
                        Default{defaultTemplate ? ` (${defaultTemplate.name})` : ""}
                      </option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Batch assign */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted">Set all to</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleSetAll(e.target.value);
              }}
              className="flex-1 text-sm bg-surface-hover border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="" disabled>Choose template...</option>
              <option value="__default__">
                Default{defaultTemplate ? ` (${defaultTemplate.name})` : ""}
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
