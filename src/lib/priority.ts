// Rule-based heuristic. NOT AI or machine learning: a transparent weighted sum.
// Priority = 0.5 × urgency + 0.3 × importance + 0.2 × difficulty  (each on a 1–10 scale)
export interface PriorityInput { dueDate: string; importance: number; difficulty: number }
export interface PriorityResult { urgency: number; importance: number; difficulty: number; score: number }

const clamp = (n: number, lo = 1, hi = 10) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function daysUntil(dueDate: string, today = new Date()): number {
  const d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const [y, m, d] = dueDate.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - d0) / 86_400_000);
}

/** Overdue/today = 10, 14+ days away = 1, linear in between. */
export function urgencyScore(dueDate: string, today = new Date()): number {
  const days = daysUntil(dueDate, today);
  if (days <= 0) return 10;
  if (days >= 14) return 1;
  return round1(10 - (days / 14) * 9);
}

export function priorityScore(t: PriorityInput, today = new Date()): PriorityResult {
  const urgency = urgencyScore(t.dueDate, today);
  const importance = clamp(t.importance), difficulty = clamp(t.difficulty);
  return { urgency, importance, difficulty, score: round1(0.5 * urgency + 0.3 * importance + 0.2 * difficulty) };
}

export const sortByPriority = <T extends PriorityInput>(tasks: T[], today = new Date()) =>
  tasks.map(t => ({ task: t, p: priorityScore(t, today) })).sort((a, b) => b.p.score - a.p.score);