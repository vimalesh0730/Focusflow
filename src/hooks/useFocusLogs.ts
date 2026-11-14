import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface FocusLog { id: string; task_id: string | null; minutes: number; started_at: string }

export function useFocusLogs() {
  const [logs, setLogs] = useState<FocusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("focus_logs").select("id, task_id, minutes, started_at")
      .order("started_at", { ascending: false }).limit(500);
    if (error) setError(error.message);
    else { setLogs(data as FocusLog[]); setError(""); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (minutes: number, taskId: string | null) => {
    const { error } = await supabase.from("focus_logs").insert({
      minutes, task_id: taskId, started_at: new Date(Date.now() - minutes * 60000).toISOString(),
    });
    if (!error) await load();
    return error?.message;
  };
  return { logs, loading, error, add };
}