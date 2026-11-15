import { createClient } from "@supabase/supabase-js";

const clean = (v?: string) => (v ?? "").trim().replace(/^["']+|["']+$/g, "");

const url = clean(import.meta.env.VITE_SUPABASE_URL)
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/+$/, "");
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isConfigured = /^https?:\/\/[^\s]+$/i.test(url) && key.length > 0;

// Only the public anon/publishable key is used. Never put a secret or service_role key in frontend code.
export const supabase = createClient(
  isConfigured ? url : "https://placeholder.supabase.co",
  isConfigured ? key : "placeholder-key"
);