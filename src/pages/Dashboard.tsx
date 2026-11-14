import { AlertCircle } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useSessions } from "@/hooks/useSessions";
import { useFocusLogs } from "@/hooks/useFocusLogs";
import { addDays, isoOfTimestamp, mondayOf, todayISO } from "@/lib/dates";
import { daysUntil } from "@/lib/priority";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="shadow-sm"><CardContent className="p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-indigo-700">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </CardContent></Card>
  );
}

export default function Dashboard() {
  const t = useTasks();
  const s = useSessions();
  const f = useFocusLogs();

  if (t.loading || s.loading || f.loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  const today = todayISO();
  const titles = new Map(t.tasks.map((x) => [x.id, x.title]));
  const pending = t.tasks.filter((x) => x.status !== "completed");
  const completed = t.tasks.filter((x) => x.status === "completed");
  const todaySessions = s.sessions.filter((x) => x.session_date === today);
  const upcoming = [...pending].sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5);

  const days = new Set<string>();
  s.sessions.filter((x) => x.completed).forEach((x) => days.add(x.session_date));
  t.tasks.forEach((x) => { if (x.completed_at) days.add(isoOfTimestamp(x.completed_at)); });
  f.logs.forEach((l) => days.add(isoOfTimestamp(l.started_at)));
  const focusToday = f.logs
    .filter((l) => isoOfTimestamp(l.started_at) === today)
    .reduce((a, l) => a + l.minutes, 0);

  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) { streak++; cursor = addDays(cursor, -1); }

  const wkStart = mondayOf(today), wkEnd = addDays(wkStart, 6);
  const week = s.sessions.filter((x) => x.session_date >= wkStart && x.session_date <= wkEnd);
  const planned = week.reduce((a, x) => a + x.minutes, 0);
  const done = week.filter((x) => x.completed).reduce((a, x) => a + x.minutes, 0);
  const pct = planned ? Math.round((done / planned) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {(t.error || s.error || f.error) && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Error: {t.error || s.error || f.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Today's sessions" value={`${todaySessions.filter((x) => x.completed).length}/${todaySessions.length}`} sub="completed / planned" />
        <Stat label="Pending tasks" value={pending.length} />
        <Stat label="Completed tasks" value={completed.length} />
        <Stat label="Study streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
        <Stat label="Focus today" value={`${focusToday} min`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Today's plan</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {todaySessions.length === 0 && <p className="text-slate-500">Nothing scheduled today. Generate a schedule on the Smart Schedule page.</p>}
            {todaySessions.map((x) => (
              <div key={x.id} className="flex justify-between">
                <span className={x.completed ? "text-slate-400 line-through" : ""}>{titles.get(x.task_id) ?? "Task"}</span>
                <span className="text-slate-500">{x.minutes} min</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Upcoming deadlines</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {upcoming.length === 0 && <p className="text-slate-500">No pending tasks. Add one on the Tasks page.</p>}
            {upcoming.map((x) => {
              const d = daysUntil(x.due_date);
              return (
                <div key={x.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{x.title}</span>
                  <span className={`flex shrink-0 items-center gap-1 ${d < 0 ? "text-red-600" : "text-slate-500"}`}>
                    {d < 0 && <AlertCircle className="h-3 w-3" />}
                    {d < 0 ? `${-d}d overdue` : d === 0 ? "Due today" : `${d}d left`}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Weekly progress</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Progress value={pct} />
          <p className="text-sm text-slate-500">{done} of {planned} planned minutes completed this week ({pct}%)</p>
        </CardContent>
      </Card>
    </div>
  );
}