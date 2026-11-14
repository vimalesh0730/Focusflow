import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/dates";
import type { StudySession } from "@/types/db";

export type NewSession = { task_id: string; session_date: string; minutes: number };

export function useSessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("study_sessions").select("*").order("session_date");
    if (error) setError(error.message);
    else { setSessions(data as StudySession[]); setError(""); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p;
    if (!error) await load();
    return error?.message;
  };
  const setDate = (id: string, session_date: string) =>
    run(supabase.from("study_sessions").update({ session_date }).eq("id", id));
  const setDone = (id: string, completed: boolean) =>
    run(supabase.from("study_sessions").update({ completed }).eq("id", id));

  // Replaces today's and future UNCOMPLETED sessions with the new plan.
  const saveSchedule = async (rows: NewSession[]) => {
    const del = await supabase.from("study_sessions").delete().gte("session_date", todayISO()).eq("completed", false);
    if (del.error) return del.error.message;
    if (rows.length) {
      const ins = await supabase.from("study_sessions").insert(rows);
      if (ins.error) return ins.error.message;
    }
    await load();
    return undefined;
  };

  return { sessions, loading, error, setDate, setDone, saveSchedule };
}