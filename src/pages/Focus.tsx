import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useFocusLogs } from "@/hooks/useFocusLogs";
import { addDays, isoOfTimestamp, todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Mode = "focus" | "short" | "long";
interface Saved { mode: Mode; endAt: number | null; leftMs: number; totalMs: number; taskId: string; cycles: number; focusMin: number }

const KEY = "focusflow.timer.v1";
const NAMES: Record<Mode, string> = { focus: "Focus", short: "Short break", long: "Long break" };
const minutesFor = (m: Mode, focusMin: number) => (m === "focus" ? focusMin : m === "short" ? 5 : 15);
const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const field = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

function fresh(): Saved {
  return { mode: "focus", endAt: null, leftMs: 25 * 60000, totalMs: 25 * 60000, taskId: "", cycles: 0, focusMin: 25 };
}
function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = { ...fresh(), ...JSON.parse(raw) } as Saved;
    // A block that ended long ago is dropped instead of being logged.
    if (s.endAt && Date.now() - s.endAt > 5 * 60000) return { ...s, endAt: null, leftMs: s.totalMs };
    return s;
  } catch { return fresh(); }
}
function beep() {
  try {
    const ctx = new window.AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.1;
    o.start(); o.stop(ctx.currentTime + 0.4);
  } catch { /* sound is optional */ }
}

export default function Focus() {
  const { tasks } = useTasks();
  const logs = useFocusLogs();
  const [s, setS] = useState<Saved>(load);
  const [now, setNow] = useState(Date.now());
  const [msg, setMsg] = useState("");
  const handled = useRef<number | null>(null);

  const patch = (p: Partial<Saved>) => setS((prev) => ({ ...prev, ...p }));
  const running = s.endAt !== null;
  const remaining = s.endAt ? Math.max(0, s.endAt - now) : s.leftMs;

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    document.title = running ? `${fmt(remaining)} · ${NAMES[s.mode]}` : "FocusFlow";
    return () => { document.title = "FocusFlow"; };
  }, [running, remaining, s.mode]);

  async function logFocus(minutes: number) {
    if (minutes < 1) return;
    const err = await logs.add(minutes, s.taskId || null);
    setMsg(err ? `Could not save focus time: ${err}` : `Logged ${minutes} min of focus.`);
  }
  function advance(completed: boolean) {
    const cycles = s.mode === "focus" && completed ? s.cycles + 1 : s.cycles;
    const next: Mode = s.mode !== "focus" ? "focus" : completed && cycles % 4 === 0 ? "long" : "short";
    const ms = minutesFor(next, s.focusMin) * 60000;
    setS({ ...s, mode: next, cycles, endAt: null, leftMs: ms, totalMs: ms });
  }
  function finish() {
    beep();
    if (s.mode === "focus") logFocus(Math.round(s.totalMs / 60000));
    advance(true);
  }
  useEffect(() => {
    if (s.endAt && now >= s.endAt && handled.current !== s.endAt) { handled.current = s.endAt; finish(); }
  });

  function toggle() {
    setMsg("");
    if (running) patch({ endAt: null, leftMs: Math.max(0, (s.endAt as number) - Date.now()) });
    else { setNow(Date.now()); patch({ endAt: Date.now() + s.leftMs }); }
  }
  function reset() {
    const ms = minutesFor(s.mode, s.focusMin) * 60000;
    patch({ endAt: null, leftMs: ms, totalMs: ms });
  }
  function pick(m: Mode) {
    const ms = minutesFor(m, s.focusMin) * 60000;
    patch({ mode: m, endAt: null, leftMs: ms, totalMs: ms });
  }
  function endBlock() {
    if (s.mode === "focus") logFocus(Math.floor((s.totalMs - remaining) / 60000));
    advance(false);
  }
  function setFocusMin(n: number) {
    const upd: Partial<Saved> = { focusMin: n };
    if (s.mode === "focus" && !running) { upd.leftMs = n * 60000; upd.totalMs = n * 60000; }
    patch(upd);
  }

  const titles = useMemo(() => new Map(tasks.map((t) => [t.id, t.title])), [tasks]);
  const pending = tasks.filter((t) => t.status !== "completed");
  const today = todayISO(), weekStart = addDays(today, -6);
  const todayLogs = logs.logs.filter((l) => isoOfTimestamp(l.started_at) === today);
  const todayMin = todayLogs.reduce((a, l) => a + l.minutes, 0);
  const weekMin = logs.logs.filter((l) => isoOfTimestamp(l.started_at) >= weekStart).reduce((a, l) => a + l.minutes, 0);

  const R = 110, C = 2 * Math.PI * R;
  const pct = s.totalMs ? 1 - remaining / s.totalMs : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Focus Clock</h1>
      {logs.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not load focus history: {logs.error}</p>}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="shadow-sm lg:col-span-3"><CardContent className="space-y-6 p-6">
          <div className="flex justify-center gap-1 rounded-lg bg-muted p-1">
            {(["focus", "short", "long"] as Mode[]).map((m) => (
              <button key={m} onClick={() => pick(m)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm ${s.mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {NAMES[m]}
              </button>
            ))}
          </div>

          <div className="relative mx-auto h-64 w-64">
            <svg viewBox="0 0 260 260" className="h-64 w-64 -rotate-90">
              <circle cx="130" cy="130" r={R} fill="none" stroke="currentColor" className="text-muted" strokeWidth="10" />
              <circle cx="130" cy="130" r={R} fill="none" stroke="currentColor" className="text-primary" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="font-mono text-5xl font-semibold tabular-nums">{fmt(remaining)}</div>
                <div className="mt-1 text-sm text-muted-foreground">{NAMES[s.mode]} · block {s.cycles + (s.mode === "focus" ? 1 : 0)}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button size="lg" onClick={toggle}>
              {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button size="lg" variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
            <Button size="lg" variant="outline" onClick={endBlock}><SkipForward className="mr-2 h-4 w-4" /> End block</Button>
          </div>
          {msg && <p className="text-center text-sm text-muted-foreground">{msg}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ft">Working on</Label>
              <select id="ft" className={field} value={s.taskId} onChange={(e) => patch({ taskId: e.target.value })}>
                <option value="">No specific task</option>
                {pending.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fm">Focus length</Label>
              <select id="fm" className={field} value={s.focusMin} onChange={(e) => setFocusMin(Number(e.target.value))}>
                {[15, 25, 30, 45, 50, 60, 90].map((n) => <option key={n} value={n}>{n} minutes</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            A long break (15 min) follows every 4th focus block. "End block" logs the minutes you actually focused. Reset logs nothing.
          </p>
        </CardContent></Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-sm"><CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Focus today</div>
              <div className="text-2xl font-semibold text-primary">{todayMin} min</div>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Last 7 days</div>
              <div className="text-2xl font-semibold text-primary">{(weekMin / 60).toFixed(1)} h</div>
            </CardContent></Card>
          </div>
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Today's focus log</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {todayLogs.length === 0 && <p className="text-muted-foreground">No focus blocks logged yet today.</p>}
              {todayLogs.map((l) => (
                <div key={l.id} className="flex justify-between gap-2">
                  <span className="truncate">{(l.task_id && titles.get(l.task_id)) || "General study"}</span>
                  <span className="shrink-0 text-muted-foreground">{l.minutes} min</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}