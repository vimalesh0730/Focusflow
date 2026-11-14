import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/types/db";

export type TaskInput = Omit<Task, "id" | "completed_at" | "created_at">;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("tasks").select("*").order("due_date");
    if (error) setError(error.message);
    else { setTasks(data as Task[]); setError(""); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p;
    if (!error) await load();
    return error?.message;
  };
  const create = (v: TaskInput) =>
    run(supabase.from("tasks").insert({ ...v, completed_at: v.status === "completed" ? new Date().toISOString() : null }));
  const update = (id: string, v: TaskInput) => {
    const prev = tasks.find((t) => t.id === id);
    return run(supabase.from("tasks").update({
      ...v,
      completed_at: v.status === "completed" ? prev?.completed_at ?? new Date().toISOString() : null,
    }).eq("id", id));
  };
  const remove = (id: string) => run(supabase.from("tasks").delete().eq("id", id));
  const setDone = (t: Task, done: boolean) =>
    run(supabase.from("tasks").update({
      status: done ? "completed" : "pending",
      completed_at: done ? new Date().toISOString() : null,
    }).eq("id", t.id));

  return { tasks, loading, error, create, update, remove, setDone };
}