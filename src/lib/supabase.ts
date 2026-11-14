import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && key);

// Only the public anon key is used. Never put the service_role key in frontend code.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder-key"
);