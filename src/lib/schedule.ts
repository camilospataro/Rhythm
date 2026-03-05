import type { TaskSchedule } from "@/lib/resolveTemplate";

export type TimeState = "available" | "upcoming" | "overdue" | "locked";

export function getTimeState(schedule: TaskSchedule | null): TimeState {
  if (!schedule) return "available";

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  function toMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  // Time window takes priority
  if (schedule.window_start && schedule.window_end) {
    const start = toMinutes(schedule.window_start);
    const end = toMinutes(schedule.window_end);
    if (nowMinutes < start) return schedule.time_strict ? "locked" : "upcoming";
    if (nowMinutes > end) return schedule.time_strict ? "locked" : "overdue";
    return "available";
  }

  // Deadline
  if (schedule.deadline_time) {
    const deadline = toMinutes(schedule.deadline_time);
    if (nowMinutes > deadline) return schedule.time_strict ? "locked" : "overdue";
    return "available";
  }

  return "available";
}

export function formatTime12(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export function getScheduleLabel(schedule: TaskSchedule | null, timeState: TimeState): string | null {
  if (!schedule) return null;

  if (schedule.window_start && schedule.window_end) {
    switch (timeState) {
      case "upcoming":
        return `Available at ${formatTime12(schedule.window_start)}`;
      case "overdue":
        return `Window closed at ${formatTime12(schedule.window_end)}`;
      case "locked":
        if (getTimeState({ ...schedule, time_strict: false }) === "upcoming") {
          return `Locked until ${formatTime12(schedule.window_start)}`;
        }
        return `Locked — window closed`;
      case "available":
        return `Until ${formatTime12(schedule.window_end)}`;
    }
  }

  if (schedule.deadline_time) {
    switch (timeState) {
      case "overdue":
        return `Overdue — deadline was ${formatTime12(schedule.deadline_time)}`;
      case "locked":
        return `Locked — deadline passed`;
      case "available":
        return `Due by ${formatTime12(schedule.deadline_time)}`;
    }
  }

  return null;
}
