"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Task, Completion, TaskQuality, QualityCompletion } from "@/types/database";
import { subDays, format } from "date-fns";
import { cn } from "@/lib/utils";

interface TrendsClientProps {
  tasks: Task[];
  completions: Completion[];
  taskQualities: TaskQuality[];
  qualityCompletions: QualityCompletion[];
}

type Range = "7d" | "30d" | "90d";
type Section = "overview" | "qualities" | "tags" | "correlations";

// Generate distinct colors by rotating hue
const QUALITY_COLORS = [
  "hsl(210, 80%, 55%)", // blue
  "hsl(340, 75%, 55%)", // pink
  "hsl(150, 65%, 45%)", // green
  "hsl(45, 85%, 50%)",  // amber
  "hsl(270, 65%, 55%)", // purple
  "hsl(15, 80%, 55%)",  // orange
  "hsl(180, 60%, 45%)", // teal
  "hsl(0, 70%, 55%)",   // red
];

export default function TrendsClient({
  tasks,
  completions,
  taskQualities,
  qualityCompletions,
}: TrendsClientProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    tasks[0]?.id || null
  );
  const [range, setRange] = useState<Range>("30d");
  const [section, setSection] = useState<Section>("overview");

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const startDate = subDays(new Date(), rangeDays);

  // Reset section when task changes
  useEffect(() => {
    setSection("overview");
  }, [selectedTaskId]);

  // Qualities for selected task
  const qualitiesForTask = useMemo(
    () => taskQualities.filter((q) => q.task_id === selectedTaskId),
    [taskQualities, selectedTaskId]
  );

  // Map completion_id → QualityCompletion[] for this task's qualities
  const qcByCompletionId = useMemo(() => {
    const qualityIds = new Set(qualitiesForTask.map((q) => q.id));
    const map = new Map<string, QualityCompletion[]>();
    for (const qc of qualityCompletions) {
      if (!qualityIds.has(qc.quality_id)) continue;
      const arr = map.get(qc.completion_id) || [];
      arr.push(qc);
      map.set(qc.completion_id, arr);
    }
    return map;
  }, [qualityCompletions, qualitiesForTask]);

  // Task completions filtered by date range
  const taskCompletions = useMemo(
    () =>
      completions.filter(
        (c) => c.task_id === selectedTaskId && new Date(c.date) >= startDate
      ),
    [completions, selectedTaskId, startDate]
  );

  const dateMap = useMemo(() => {
    const m = new Map<string, Completion>();
    for (const c of taskCompletions) m.set(c.date, c);
    return m;
  }, [taskCompletions]);

  // Dates array for the range
  const dates = useMemo(() => {
    const arr: { dateStr: string; label: string }[] = [];
    for (let i = 0; i < rangeDays; i++) {
      const d = subDays(new Date(), rangeDays - 1 - i);
      arr.push({ dateStr: format(d, "yyyy-MM-dd"), label: format(d, "MMM d") });
    }
    return arr;
  }, [rangeDays]);

  // === OVERVIEW DATA ===
  const chartData = useMemo(() => {
    if (!selectedTaskId) return [];
    return dates.map(({ dateStr, label }) => {
      const completion = dateMap.get(dateStr);
      return {
        date: label,
        value:
          selectedTask?.type === "checkbox"
            ? completion?.completed ? 1 : 0
            : completion?.rating ?? null,
        completed: completion?.completed ? 1 : 0,
      };
    });
  }, [selectedTaskId, dates, dateMap, selectedTask]);

  // Streak
  const streak = useMemo(() => {
    if (!selectedTaskId) return 0;
    let count = 0;
    for (let i = 0; ; i++) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, "yyyy-MM-dd");
      const c = completions.find(
        (comp) => comp.task_id === selectedTaskId && comp.date === dateStr
      );
      const done =
        selectedTask?.type === "checkbox" ? c?.completed : c?.rating != null;
      if (done) count++;
      else break;
    }
    return count;
  }, [selectedTaskId, completions, selectedTask]);

  // Rating distribution (for overview)
  const ratingDistribution = useMemo(() => {
    if (!selectedTask || selectedTask.type === "checkbox" || !selectedTask.rating_max) return null;
    const counts: Record<number, number> = {};
    for (let v = 1; v <= selectedTask.rating_max; v++) counts[v] = 0;
    for (const c of taskCompletions) {
      if (c.rating != null && counts[c.rating] !== undefined) counts[c.rating]++;
    }
    return Object.entries(counts).map(([rating, count]) => ({
      rating: Number(rating),
      count,
    }));
  }, [selectedTask, taskCompletions]);

  // === QUALITY TRENDS DATA ===
  const qualityChartData = useMemo(() => {
    if (qualitiesForTask.length === 0) return [];
    return dates.map(({ dateStr, label }) => {
      const completion = dateMap.get(dateStr);
      const qcs = completion ? qcByCompletionId.get(completion.id) || [] : [];
      const point: Record<string, string | number | null> = { date: label };
      for (const q of qualitiesForTask) {
        const qc = qcs.find((c) => c.quality_id === q.id);
        if (q.type === "rating") {
          point[q.name] = qc?.rating ?? null;
        } else {
          point[q.name] = qc?.completed ? 1 : 0;
        }
      }
      return point;
    });
  }, [dates, dateMap, qcByCompletionId, qualitiesForTask]);

  // Per-quality stats
  const qualityStats = useMemo(() => {
    return qualitiesForTask.map((q, idx) => {
      const values: number[] = [];
      const recent7: number[] = [];
      const prev7: number[] = [];

      dates.forEach(({ dateStr }, i) => {
        const completion = dateMap.get(dateStr);
        const qcs = completion ? qcByCompletionId.get(completion.id) || [] : [];
        const qc = qcs.find((c) => c.quality_id === q.id);
        const val =
          q.type === "rating"
            ? qc?.rating ?? null
            : qc?.completed ? 1 : 0;
        if (val !== null) {
          values.push(val);
          if (i >= dates.length - 7) recent7.push(val);
          else if (i >= dates.length - 14) prev7.push(val);
        }
      });

      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const recentAvg = recent7.length > 0 ? recent7.reduce((a, b) => a + b, 0) / recent7.length : 0;
      const prevAvg = prev7.length > 0 ? prev7.reduce((a, b) => a + b, 0) / prev7.length : 0;
      const trend = recentAvg - prevAvg;

      return {
        quality: q,
        color: QUALITY_COLORS[idx % QUALITY_COLORS.length],
        avg: Math.round(avg * 10) / 10,
        trend: Math.round(trend * 10) / 10,
        completionRate: q.type === "checkbox"
          ? Math.round((values.filter((v) => v === 1).length / Math.max(dates.length, 1)) * 100)
          : null,
      };
    });
  }, [qualitiesForTask, dates, dateMap, qcByCompletionId]);

  // === TAG ANALYTICS DATA ===
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const q of qualitiesForTask) {
      for (const t of q.tags || []) tagSet.add(t);
    }
    return Array.from(tagSet);
  }, [qualitiesForTask]);

  const tagAnalytics = useMemo(() => {
    if (allTags.length === 0) return { counts: [], correlations: [] };

    // Collect all quality completions in range with their tags
    const tagCounts = new Map<string, number>();
    const tagRatings = new Map<string, number[]>();
    const noTagRatings: number[] = [];
    let totalEntries = 0;

    for (const c of taskCompletions) {
      const qcs = qcByCompletionId.get(c.id) || [];
      for (const qc of qcs) {
        const q = qualitiesForTask.find((q) => q.id === qc.quality_id);
        if (!q) continue;
        const tags = qc.selected_tags || [];
        const rating = qc.rating;
        totalEntries++;

        if (tags.length === 0 && rating != null) {
          noTagRatings.push(rating);
        }

        for (const tag of tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          if (rating != null) {
            const arr = tagRatings.get(tag) || [];
            arr.push(rating);
            tagRatings.set(tag, arr);
          }
        }
      }
    }

    const counts = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count, total: totalEntries }));

    // Tag-rating correlations
    const allRatings: number[] = [];
    for (const c of taskCompletions) {
      const qcs = qcByCompletionId.get(c.id) || [];
      for (const qc of qcs) {
        if (qc.rating != null) allRatings.push(qc.rating);
      }
    }
    const overallAvg = allRatings.length > 0
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : 0;

    const correlations = Array.from(tagRatings.entries())
      .map(([tag, ratings]) => {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        return {
          tag,
          avgWithTag: Math.round(avg * 10) / 10,
          avgOverall: Math.round(overallAvg * 10) / 10,
          delta: Math.round((avg - overallAvg) * 10) / 10,
          sampleSize: ratings.length,
        };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return { counts, correlations };
  }, [allTags, taskCompletions, qcByCompletionId, qualitiesForTask]);

  // === CORRELATIONS DATA ===
  const correlationInsights = useMemo(() => {
    const ratingQualities = qualitiesForTask.filter((q) => q.type === "rating");
    if (ratingQualities.length < 2) return [];

    // Build per-date quality values
    const dateValues = new Map<string, Map<string, number>>();
    for (const c of taskCompletions) {
      const qcs = qcByCompletionId.get(c.id) || [];
      const vals = new Map<string, number>();
      for (const qc of qcs) {
        if (qc.rating != null) vals.set(qc.quality_id, qc.rating);
      }
      if (vals.size >= 2) dateValues.set(c.date, vals);
    }

    const insights: {
      qualityA: TaskQuality;
      qualityB: TaskQuality;
      avgBWhenAHigh: number;
      avgBWhenALow: number;
      delta: number;
    }[] = [];

    for (let i = 0; i < ratingQualities.length; i++) {
      for (let j = i + 1; j < ratingQualities.length; j++) {
        const qA = ratingQualities[i];
        const qB = ratingQualities[j];

        const pairs: { a: number; b: number }[] = [];
        for (const vals of dateValues.values()) {
          const a = vals.get(qA.id);
          const b = vals.get(qB.id);
          if (a != null && b != null) pairs.push({ a, b });
        }

        if (pairs.length < 3) continue;

        const medianA =
          [...pairs.map((p) => p.a)].sort((a, b) => a - b)[
            Math.floor(pairs.length / 2)
          ];

        const highB = pairs.filter((p) => p.a > medianA).map((p) => p.b);
        const lowB = pairs.filter((p) => p.a <= medianA).map((p) => p.b);

        if (highB.length === 0 || lowB.length === 0) continue;

        const avgHigh = highB.reduce((a, b) => a + b, 0) / highB.length;
        const avgLow = lowB.reduce((a, b) => a + b, 0) / lowB.length;

        insights.push({
          qualityA: qA,
          qualityB: qB,
          avgBWhenAHigh: Math.round(avgHigh * 10) / 10,
          avgBWhenALow: Math.round(avgLow * 10) / 10,
          delta: Math.round((avgHigh - avgLow) * 10) / 10,
        });
      }
    }

    return insights.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [qualitiesForTask, taskCompletions, qcByCompletionId]);

  // Available sections for current task
  const availableSections = useMemo(() => {
    const sections: { key: Section; label: string }[] = [
      { key: "overview", label: "Overview" },
    ];
    if (selectedTask?.type === "multi_quality" && qualitiesForTask.length > 0) {
      sections.push({ key: "qualities", label: "Qualities" });
    }
    if (allTags.length > 0) {
      sections.push({ key: "tags", label: "Tags" });
    }
    if (qualitiesForTask.filter((q) => q.type === "rating").length >= 2) {
      sections.push({ key: "correlations", label: "Correlations" });
    }
    return sections;
  }, [selectedTask, qualitiesForTask, allTags]);

  const xAxisInterval = range === "7d" ? 0 : range === "30d" ? 6 : 14;

  if (tasks.length === 0) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Card>
          <p className="text-sm text-muted text-center py-8">
            No tasks to show trends for. Create tasks in the Task Manager first.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Task Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => setSelectedTaskId(task.id)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              selectedTaskId === task.id
                ? "bg-primary text-white"
                : "bg-surface-hover text-muted hover:text-foreground"
            )}
          >
            {task.name}
          </button>
        ))}
      </div>

      {/* Range Selector */}
      <div className="flex gap-2">
        {(["7d", "30d", "90d"] as Range[]).map((r) => (
          <Button
            key={r}
            size="sm"
            variant={range === r ? "primary" : "secondary"}
            onClick={() => setRange(r)}
          >
            {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
          </Button>
        ))}
      </div>

      {/* Section Tabs */}
      {availableSections.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {availableSections.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                section === s.key
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-transparent border-border text-muted hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ========== OVERVIEW SECTION ========== */}
      {section === "overview" && selectedTask && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <p className="text-xs text-muted">Current Streak</p>
              <p className="text-2xl font-bold text-primary">{streak}</p>
              <p className="text-xs text-muted">days</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Completion Rate</p>
              <p className="text-2xl font-bold text-primary">
                {chartData.length > 0
                  ? Math.round(
                      (chartData.filter((d) =>
                        selectedTask.type === "checkbox"
                          ? d.completed === 1
                          : d.value != null
                      ).length /
                        chartData.length) *
                        100
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-muted">last {rangeDays} days</p>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              {selectedTask.type === "checkbox" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted)" interval={xAxisInterval} />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted)" domain={[0, 1]} ticks={[0, 1]} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted)" interval={xAxisInterval} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="var(--muted)"
                    domain={[selectedTask.rating_min || 1, selectedTask.rating_max || 5]}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--primary)", r: 3 }}
                    connectNulls={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Card>

          {/* Rating Distribution */}
          {ratingDistribution && (
            <Card>
              <p className="text-xs text-muted mb-3">Rating Distribution</p>
              <div className="space-y-1.5">
                {ratingDistribution.map(({ rating, count }) => {
                  const max = Math.max(...ratingDistribution.map((d) => d.count), 1);
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs text-muted w-4 text-right">{rating}</span>
                      <div className="flex-1 h-5 bg-surface-hover rounded-md overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-md transition-all"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted w-6">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ========== QUALITIES SECTION ========== */}
      {section === "qualities" && qualitiesForTask.length > 0 && (
        <>
          {/* Multi-line quality chart */}
          <Card className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={qualityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted)" interval={xAxisInterval} />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted)" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {qualitiesForTask.map((q, i) => (
                  <Line
                    key={q.id}
                    type="monotone"
                    dataKey={q.name}
                    stroke={QUALITY_COLORS[i % QUALITY_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Per-quality stats */}
          <div className="space-y-2">
            {qualityStats.map((stat) => (
              <Card key={stat.quality.id} className="!py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-sm font-medium">{stat.quality.name}</span>
                    <span className="text-xs text-muted capitalize">({stat.quality.type})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {stat.completionRate !== null ? (
                      <span className="text-sm font-bold text-primary">{stat.completionRate}%</span>
                    ) : (
                      <span className="text-sm font-bold text-primary">{stat.avg}</span>
                    )}
                    {stat.trend !== 0 && (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          stat.trend > 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {stat.trend > 0 ? "+" : ""}{stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ========== TAGS SECTION ========== */}
      {section === "tags" && allTags.length > 0 && (
        <>
          {/* Tag Frequency */}
          <Card>
            <p className="text-xs text-muted mb-3">Tag Frequency</p>
            {tagAnalytics.counts.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No tag data in this range yet.</p>
            ) : (
              <div className="space-y-1.5">
                {tagAnalytics.counts.map(({ tag, count, total }) => {
                  const max = Math.max(...tagAnalytics.counts.map((d) => d.count), 1);
                  return (
                    <div key={tag} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-20 truncate">{tag}</span>
                      <div className="flex-1 h-5 bg-surface-hover rounded-md overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-md transition-all"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted w-12 text-right">
                        {count}/{total}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Tag-Rating Correlation */}
          {tagAnalytics.correlations.length > 0 && (
            <Card>
              <p className="text-xs text-muted mb-3">Tag-Rating Impact</p>
              <div className="space-y-3">
                {tagAnalytics.correlations.map(({ tag, avgWithTag, avgOverall, delta, sampleSize }) => (
                  <div key={tag} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 border border-primary/20 text-primary">
                        {tag}
                      </span>
                      <span className="text-xs text-muted">n={sampleSize}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">avg {avgWithTag} vs {avgOverall}</span>
                      <span
                        className={cn(
                          "text-xs font-bold min-w-[40px] text-right",
                          delta > 0 ? "text-success" : delta < 0 ? "text-danger" : "text-muted"
                        )}
                      >
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ========== CORRELATIONS SECTION ========== */}
      {section === "correlations" && correlationInsights.length > 0 && (
        <>
          <p className="text-xs text-muted">How qualities relate to each other</p>
          <div className="space-y-2">
            {correlationInsights.map((insight, i) => (
              <Card key={i} className="!py-3">
                <p className="text-xs text-muted mb-2">
                  When <span className="font-semibold text-foreground">{insight.qualityA.name}</span> is above median:
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{insight.qualityB.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-muted">high: </span>
                      <span className="text-sm font-bold text-primary">{insight.avgBWhenAHigh}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted">low: </span>
                      <span className="text-sm font-bold">{insight.avgBWhenALow}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold min-w-[40px] text-right",
                        insight.delta > 0 ? "text-success" : insight.delta < 0 ? "text-danger" : "text-muted"
                      )}
                    >
                      {insight.delta > 0 ? "+" : ""}{insight.delta}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {section === "correlations" && correlationInsights.length === 0 && (
        <Card>
          <p className="text-sm text-muted text-center py-4">
            Not enough data yet to show correlations. Keep logging ratings for at least 2 qualities.
          </p>
        </Card>
      )}
    </div>
  );
}
