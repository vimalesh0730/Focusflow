import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/db";

export const DEFAULT_HOURS: Profile["daily_hours"] = { mon: 2, tue: 2, wed: 2, thu: 2, fri: 2, sat: 3, sun: 1 };
export type ProfileInput = Pick<Profile, "full_name" | "daily_hours" | "max_session_min">;

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) setError(error.message);
      else setProfile((data as Profile) ?? { id: user.id, full_name: null, daily_hours: DEFAULT_HOURS, max_session_min: 90 });
      setLoading(false);
    })();
  }, []);

  const save = async (v: ProfileInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Not signed in";
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...v });
    if (error) return error.message;
    setProfile({ id: user.id, ...v });
    return undefined;
  };

  return { profile, loading, error, save };
}