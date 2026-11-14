import { useState } from "react";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useSubjects, type SubjectInput } from "@/hooks/useSubjects";
import type { Subject } from "@/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Max 80 characters"),
  code: z.string().trim().max(20, "Max 20 characters"),
  difficulty: z.number().int().min(1, "Difficulty must be 1–10").max(10, "Difficulty must be 1–10"),
  progress: z.number().int().min(0, "Progress must be 0–100").max(100, "Progress must be 0–100"),
});

const blank = { name: "", code: "", difficulty: "5", progress: "0" };

export default function Subjects() {
  const { subjects, loading, error, create, update, remove } = useSubjects();
  const [editing, setEditing] = useState<Subject | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  function openNew() { setEditing(null); setForm(blank); setFormError(""); setOpen(true); }
  function openEdit(s: Subject) {
    setEditing(s);
    setForm({ name: s.name, code: s.code ?? "", difficulty: String(s.difficulty), progress: String(s.progress) });
    setFormError("");
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      difficulty: Number(form.difficulty),
      progress: Number(form.progress),
    });
    if (!parsed.success) return setFormError(parsed.error.issues[0].message);
    const v: SubjectInput = { ...parsed.data, code: parsed.data.code || null };
    setBusy(true);
    const err = editing ? await update(editing.id, v) : await create(v);
    setBusy(false);
    if (err) return setFormError(err);
    setOpen(false);
  }

  async function del(s: Subject) {
    if (!window.confirm(`Delete "${s.name}"? Its tasks will stay but lose their subject.`)) return;
    const err = await remove(s.id);
    if (err) window.alert(err);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add subject</Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not load subjects: {error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : subjects.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-slate-500">
          No subjects yet. Add your first subject to start planning.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Card key={s.id} className="shadow-sm"><CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.code || "No code"} · Difficulty {s.difficulty}/10</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => del(s)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <Progress value={s.progress} />
              <div className="text-xs text-slate-500">{s.progress}% complete</div>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit subject" : "Add subject"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1"><Label htmlFor="n">Name</Label>
              <Input id="n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="c">Code (optional)</Label>
              <Input id="c" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label htmlFor="d">Difficulty (1–10)</Label>
                <Input id="d" type="number" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="p">Progress (0–100)</Label>
                <Input id="p" type="number" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} /></div>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}