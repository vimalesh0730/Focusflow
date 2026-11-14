import { daysUntil, priorityScore } from "./priority";

export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export interface SchedTask { id: string; dueDate: string; importance: number; difficulty: number; remainingMin: number }
export interface Session { taskId: string; date: string; minutes: number }
export interface ScheduleResult { sessions: Session[]; unscheduled: { taskId: string; minutes: number; reason: string }[] }

const DAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Greedy scheduler: highest priority first; each task is split into sessions
 * (<= maxSessionMin, >= minSessionMin) placed on the earliest day with free capacity,
 * never beyond the daily availability and never after the due date.
 * Whatever does not fit is returned in `unscheduled`.
 */
export function generateSchedule(
  tasks: SchedTask[],
  dailyHours: Record<Weekday, number>,
  opts: { start?: Date; horizonDays?: number; maxSessionMin?: number; minSessionMin?: number } = {}
): ScheduleResult {
  const { start = new Date(), horizonDays = 14, maxSessionMin = 90, minSessionMin = 25 } = opts;
  const free = new Map<string, number>();
  const dayList: string[] = [];
  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = iso(d); dayList.push(key);
    free.set(key, Math.max(0, Math.round((dailyHours[DAYS[d.getDay()]] ?? 0) * 60)));
  }
  const ordered = [...tasks].sort((a, b) => priorityScore(b, start).score - priorityScore(a, start).score);
  const sessions: Session[] = [], unscheduled: ScheduleResult["unscheduled"] = [];

  for (const t of ordered) {
    let left = t.remainingMin;
    const lastDay = Math.max(0, daysUntil(t.dueDate, start)); // overdue tasks go to today
    for (let i = 0; i < dayList.length && i <= lastDay && left > 0; i++) {
      const key = dayList[i];
      while (left > 0 && (free.get(key) ?? 0) >= Math.min(minSessionMin, left)) {
        const m = Math.min(left, maxSessionMin, free.get(key)!);
        sessions.push({ taskId: t.id, date: key, minutes: m });
        free.set(key, free.get(key)! - m); left -= m;
        break; // one session per task per day keeps study varied
      }
    }
    if (left > 0) unscheduled.push({ taskId: t.id, minutes: left, reason: "Not enough available study time before the due date" });
  }
  return { sessions: sessions.sort((a, b) => a.date.localeCompare(b.date)), unscheduled };
}
