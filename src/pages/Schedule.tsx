import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useSessions } from "@/hooks/useSessions";
import { useProfile, DEFAULT_HOURS } from "@/hooks/useProfile";
import { generateSchedule, type Session } from "@/lib/scheduler";
import { addDays, dayLabel, todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = { key: string; id?: string; task_id: string; date: string; minutes: number; completed: boolean };
type Unscheduled = { taskId: string; minutes: number; reason: string };

export default function Schedule() {
  const tasks = useTasks();
  const ses = useSessions();
  const { profile } = useProfile();
  const [preview, setPreview] = useState<Session[] | null>(null);
  const [unscheduled, setUnscheduled] = useState<Unscheduled[]>([]);
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const titles = useMemo(() => new Map(tasks.tasks.map((t) => [t.id, t.title])), [tasks.tasks]);

  function generate() {
    setMsg("");
    const doneMin = new Map<string, number>();
    ses.sessions.filter((s) => s.completed).forEach((s) => doneMin.set(s.task_id, (doneMin.get(s.task_id) ?? 0) + s.minutes));
    const pending = tasks.tasks
      .filter((t) => t.status !== "completed")
      .map((t) => ({
        id: t.id, dueDate: t.due_date, importance: t.importance, difficulty: t.difficulty,
        remainingMin: t.estimated_min - (doneMin.get(t.id) ?? 0),
      }))
      .filter((t) => t.remainingMin > 0);
    const res = generateSchedule(pending, profile?.daily_hours ?? DEFAULT_HOURS, { maxSessionMin: profile?.max_session_min ?? 90 });
    setPreview(res.sessions);
    setUnscheduled(res.unscheduled);
  }

  async function savePlan() {
    if (!preview) return;
    setBusy(true);
    const err = await ses.saveSchedule(preview.map((s) => ({ task_id: s.taskId, session_date: s.date, minutes: s.minutes })));
    setBusy(false);
    if (err) return setMsg(err);
    setPreview(null);
    setMsg("Schedule saved.");
  }

  const rows: Row[] = preview
    ? preview.map((s, i) => ({ key: `p${i}`, task_id: s.taskId, date: s.date, minutes: s.minutes, completed: false }))
    : ses.sessions.map((s) => ({ key: s.id, id: s.id, task_id: s.task_id, date: s.session_date, minutes: s.minutes, completed: s.completed }));

  const days = view === "daily" ? [date] : Array.from({ length: 7 }, (_, i) => addDays(date, i));
  const loading = tasks.loading || ses.loading;
  const error = tasks.error || ses.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Smart Schedule</h1>
        <Button onClick={generate} disabled={loading}><CalendarClock className="mr-2 h-4 w-4" /> Generate schedule</Button>
      </div>
      <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
        Sessions are placed by priority score (a rule-based heuristic, not AI), within your daily availability and before each due date.
        Change availability in Settings.
      </p>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Error: {error}</p>}
      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      {preview && (
        <Card className="border-indigo-200 shadow-sm"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-sm">Preview: {preview.length} session(s). Saving replaces your uncompleted sessions from today onward.</span>
          <span className="flex gap-2">
            <Button variant="outline" onClick={() => setPreview(null)}>Discard</Button>
            <Button onClick={savePlan} disabled={busy}>{busy ? "Saving…" : "Save schedule"}</Button>
          </span>
        </CardContent></Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-md border">
          {(["daily", "weekly"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 text-sm capitalize ${view === v ? "bg-indigo-600 text-white" : "bg-card text-muted-foreground"}`}>{v}</button>
          ))}
        </div>
        <Input type="date" className="w-44" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Start date" />
      </div>

      {loading ? <Skeleton className="h-48 rounded-xl" /> : (
        <div className={view === "weekly" ? "grid gap-3 md:grid-cols-7" : "grid gap-3"}>
          {days.map((d) => {
            const list = rows.filter((r) => r.date === d);
            return (
              <Card key={d} className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">{dayLabel(d)}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {list.length === 0 && <p className="text-xs text-slate-400">No sessions</p>}
                  {list.map((r) => (
                    <div key={r.key} className="space-y-1 rounded-lg border p-2 text-sm">
                      <div className="flex items-start gap-2">
                        {r.id && (
                          <input type="checkbox" className="mt-1 h-4 w-4 accent-indigo-600" checked={r.completed} aria-label="Mark session complete"
                            onChange={async (e) => { const er = await ses.setDone(r.id!, e.target.checked); if (er) setMsg(er); }} />
                        )}
                        <div className={r.completed ? "text-slate-400 line-through" : ""}>
                          {titles.get(r.task_id) ?? "Task"} <span className="text-xs text-slate-500">· {r.minutes} min</span>
                        </div>
                      </div>
                      {r.id && (
                        <input type="date" className="w-full rounded border px-1 py-0.5 text-xs" value={r.date} aria-label="Reschedule to"
                          onChange={async (e) => { if (!e.target.value) return; const er = await ses.setDate(r.id!, e.target.value); if (er) setMsg(er); }} />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {unscheduled.length > 0 && (
        <Card className="border-amber-300 shadow-sm">
          <CardHeader><CardTitle className="text-base">Unscheduled tasks</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {unscheduled.map((u) => (
              <div key={u.taskId}>{titles.get(u.taskId) ?? "Task"}: {u.minutes} min left. <span className="text-slate-500">{u.reason}</span></div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}