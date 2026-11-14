import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useSessions } from "@/hooks/useSessions";
import { useProfile, DEFAULT_HOURS } from "@/hooks/useProfile";
import { priorityScore } from "@/lib/priority";
import { addDays, dayLabel, mondayOf, toISO, todayISO } from "@/lib/dates";
import type { Weekday } from "@/lib/scheduler";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KEYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dow = (iso: string) => new Date(`${iso}T00:00:00`).getDay();

export default function Calendar() {
  const t = useTasks();
  const s = useSessions();
  const { profile } = useProfile();
  const today = todayISO();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [sel, setSel] = useState(today);

  const hours = profile?.daily_hours ?? DEFAULT_HOURS;
  const titles = useMemo(() => new Map(t.tasks.map((x) => [x.id, x.title])), [t.tasks]);
  const cells = useMemo(() => {
    const start = mondayOf(toISO(month));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [month]);

  if (t.loading || s.loading) return <Skeleton className="h-[32rem] rounded-xl" />;

  const info = (d: string) => {
    const due = t.tasks.filter((x) => x.due_date === d);
    const ses = s.sessions.filter((x) => x.session_date === d);
    const planned = ses.reduce((a, x) => a + x.minutes, 0);
    const avail = (hours[KEYS[dow(d)]] ?? 0) * 60;
    return { due, ses, planned, avail };
  };
  const move = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const monthKey = toISO(month).slice(0, 7);
  const detail = info(sel);
  const overloaded = detail.planned > detail.avail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Smart Calendar</h1>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="w-40 text-center text-sm font-medium">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
          <Button size="icon" variant="outline" aria-label="Next month" onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSel(today); }}>Today</Button>
        </div>
      </div>
      {(t.error || s.error) && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Error: {t.error || s.error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2"><CardContent className="p-3 md:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {HEAD.map((h) => <div key={h}>{h}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d) => {
              const i = info(d);
              const pendingDue = i.due.filter((x) => x.status !== "completed");
              const overdue = pendingDue.length > 0 && d < today;
              const ratio = i.avail ? i.planned / i.avail : i.planned ? 2 : 0;
              const tone = ratio > 1 ? "bg-red-500/15" : ratio > 0.7 ? "bg-amber-500/15" : ratio > 0 ? "bg-primary/10" : "";
              return (
                <button key={d} onClick={() => setSel(d)}
                  className={`min-h-[68px] rounded-lg border p-1.5 text-left text-xs md:min-h-[92px] md:p-2 ${tone} ${d.slice(0, 7) === monthKey ? "" : "opacity-40"} ${d === sel ? "ring-2 ring-primary" : ""}`}>
                  <div className={d === today ? "font-semibold text-primary" : ""}>{Number(d.slice(8))}</div>
                  {pendingDue.length > 0 && <div className={`mt-1 truncate ${overdue ? "text-red-400" : "text-amber-300"}`}>{pendingDue.length} due</div>}
                  {i.planned > 0 && <div className="truncate text-muted-foreground">{i.planned} min</div>}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tint = planned study vs your available hours: violet is comfortable, amber is nearly full, red is overloaded.
          </p>
        </CardContent></Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">{dayLabel(sel)}</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              {(detail.planned / 60).toFixed(1)} h planned / {(detail.avail / 60).toFixed(1)} h available
              {overloaded && (
                <p className="mt-1 text-red-400">
                  Overloaded. Move a session on the <Link className="underline" to="/app/schedule">Smart Schedule</Link> page.
                </p>
              )}
            </div>
            <div>
              <div className="mb-1 font-medium">Due</div>
              {detail.due.length === 0 && <p className="text-muted-foreground">Nothing due.</p>}
              {detail.due.map((x) => {
                const p = priorityScore({ dueDate: x.due_date, importance: x.importance, difficulty: x.difficulty });
                return (
                  <div key={x.id} className="flex justify-between gap-2">
                    <span className={x.status === "completed" ? "truncate text-slate-400 line-through" : "truncate"}>{x.title}</span>
                    <span className="shrink-0 text-muted-foreground">{x.status === "completed" ? "done" : `priority ${p.score}`}</span>
                  </div>
                );
              })}
            </div>
            <div>
              <div className="mb-1 font-medium">Study sessions</div>
              {detail.ses.length === 0 && <p className="text-muted-foreground">No sessions planned.</p>}
              {detail.ses.map((x) => (
                <div key={x.id} className="flex justify-between gap-2">
                  <span className={x.completed ? "truncate text-slate-400 line-through" : "truncate"}>{titles.get(x.task_id) ?? "Task"}</span>
                  <span className="shrink-0 text-muted-foreground">{x.minutes} min</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}