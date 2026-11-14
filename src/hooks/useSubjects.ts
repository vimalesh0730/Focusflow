import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Subject } from "@/types/db";

export type SubjectInput = { name: string; code: string | null; difficulty: number; progress: number };

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("subjects").select("*").order("created_at");
    if (error) setError(error.message);
    else { setSubjects(data as Subject[]); setError(""); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (v: SubjectInput) => {
    const { error } = await supabase.from("subjects").insert(v);
    if (!error) await load();
    return error?.message;
  };
  const update = async (id: string, v: SubjectInput) => {
    const { error } = await supabase.from("subjects").update(v).eq("id", id);
    if (!error) await load();
    return error?.message;
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (!error) await load();
    return error?.message;
  };
  return { subjects, loading, error, create, update, remove };
}