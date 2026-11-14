import { useMemo, useState } from "react";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTasks, type TaskInput } from "@/hooks/useTasks";
import { useSubjects } from "@/hooks/useSubjects";
import { priorityScore } from "@/lib/priority";
import { todayISO } from "@/lib/dates";
import type { Task } from "@/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const range = (lo: number, hi: number, what: string) =>
  z.number().int(`${what} must be a whole number`).min(lo, `${what} must be ${lo}–${hi}`).max(hi, `${what} must be ${lo}–${hi}`);

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title: max 120 characters"),
  description: z.string().trim().max(500, "Description: max 500 characters"),
  subject_id: z.string(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a due date"),
  estimated_min: range(15, 2400, "Duration (minutes)"),
  importance: range(1, 10, "Importance"),
  difficulty: range(1, 10, "Difficulty"),
  status: z.enum(["pending", "in_progress", "completed"]),
});

const blank = () => ({
  title: "", description: "", subject_id: "", due_date: todayISO(),
  estimated_min: "60", importance: "5", difficulty: "5", status: "pending",
});
const field = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";
const badge = (s: number) => (s >= 8 ? "bg-red-100 text-red-700" : s >= 5 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600");

export default function Tasks() {
  const { tasks, loading, error, create, update, remove, setDone } = useTasks();
  const { subjects } = useSubjects();
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank());
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const names = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
  const rows = useMemo(
    () =>
      tasks
        .map((t) => ({ t, p: priorityScore({ dueDate: t.due_date, importance: t.importance, difficulty: t.difficulty }) }))
        .filter((r) => (filter === "all" || r.t.status === filter) && r.t.title.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => Number(a.t.status === "completed") - Number(b.t.status === "completed") || b.p.score - a.p.score),
    [tasks, filter, q]
  );

  const set = (k: keyof ReturnType<typeof blank>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  function openNew() { setEditing(null); setForm(blank()); setFormError(""); setOpen(true); }
  function openEdit(t: Task) {
    setEditing(t);
    setForm({
      title: t.title, description: t.description ?? "", subject_id: t.subject_id ?? "", due_date: t.due_date,
      estimated_min: String(t.estimated_min), importance: String(t.importance),
      difficulty: String(t.difficulty), status: t.status,
    });
    setFormError(""); setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      estimated_min: Number(form.estimated_min), importance: Number(form.importance), difficulty: Number(form.difficulty),
    });
    if (!parsed.success) return setFormError(parsed.error.issues[0].message);
    const d = parsed.data;
    const v: TaskInput = {
      title: d.title, description: d.description || null, subject_id: d.subject_id || null,
      due_date: d.due_date, estimated_min: d.estimated_min, importance: d.importance,
      difficulty: d.difficulty, status: d.status,
    };
    setBusy(true);
    const err = editing ? await update(editing.id, v) : await create(v);
    setBusy(false);
    if (err) return setFormError(err);
    setOpen(false);
  }

  async function del(t: Task) {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    const err = await remove(t.id);
    if (err) window.alert(err);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add task</Button>
      </div>

      <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
        Priority = 0.5 × urgency + 0.3 × importance + 0.2 × difficulty (each 1–10). It is a rule-based heuristic,
        not AI or machine learning. Hover a score to see its breakdown.
      </p>

      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${field} max-w-[11rem]`} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not load tasks: {error}</p>}

      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-slate-500">
          {tasks.length === 0 ? "No tasks yet. Add your first task." : "No tasks match your filters."}
        </CardContent></Card>
      ) : (
        <Card className="shadow-sm"><CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Done</th><th className="p-3">Task</th>
                <th className="hidden p-3 sm:table-cell">Subject</th><th className="p-3">Due</th>
                <th className="hidden p-3 md:table-cell">Minutes</th><th className="p-3">Priority</th><th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ t, p }) => {
                const done = t.status === "completed";
                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="p-3">
                      <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={done} aria-label={`Complete ${t.title}`}
                        onChange={async (e) => { const err = await setDone(t, e.target.checked); if (err) window.alert(err); }} />
                    </td>
                    <td className="p-3">
                      <div className={done ? "text-slate-400 line-through" : "font-medium"}>{t.title}</div>
                      <div className="text-xs capitalize text-slate-500">{t.status.replace("_", " ")}</div>
                    </td>
                    <td className="hidden p-3 text-slate-600 sm:table-cell">{(t.subject_id && names.get(t.subject_id)) || "—"}</td>
                    <td className="whitespace-nowrap p-3">{t.due_date}</td>
                    <td className="hidden p-3 md:table-cell">{t.estimated_min}</td>
                    <td className="p-3">
                      {done ? "—" : (
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge(p.score)}`}
                          title={`Urgency ${p.urgency} × 0.5 + Importance ${p.importance} × 0.3 + Difficulty ${p.difficulty} × 0.2 = ${p.score}`}>
                          {p.score}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap p-3 text-right">
                      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => del(t)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit task" : "Add task"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1"><Label htmlFor="t">Title</Label><Input id="t" value={form.title} onChange={set("title")} /></div>
            <div className="space-y-1"><Label htmlFor="ds">Description (optional)</Label>
              <textarea id="ds" rows={2} className="w-full rounded-md border border-input bg-transparent p-2 text-sm" value={form.description} onChange={set("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label htmlFor="sb">Subject</Label>
                <select id="sb" className={field} value={form.subject_id} onChange={set("subject_id")}>
                  <option value="">No subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
              <div className="space-y-1"><Label htmlFor="du">Due date</Label><Input id="du" type="date" value={form.due_date} onChange={set("due_date")} /></div>
              <div className="space-y-1"><Label htmlFor="es">Estimated minutes</Label><Input id="es" type="number" value={form.estimated_min} onChange={set("estimated_min")} /></div>
              <div className="space-y-1"><Label htmlFor="st">Status</Label>
                <select id="st" className={field} value={form.status} onChange={set("status")}>
                  <option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
                </select></div>
              <div className="space-y-1"><Label htmlFor="im">Importance (1–10)</Label><Input id="im" type="number" value={form.importance} onChange={set("importance")} /></div>
              <div className="space-y-1"><Label htmlFor="df">Difficulty (1–10)</Label><Input id="df" type="number" value={form.difficulty} onChange={set("difficulty")} /></div>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}