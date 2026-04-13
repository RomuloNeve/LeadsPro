import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const FALLBACK_BACKEND_URL = "https://sbcjupyigboefiqfrjqk.supabase.co";
const FALLBACK_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiY2p1cHlpZ2JvZWZpcWZyanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDU3MzksImV4cCI6MjA4NzgyMTczOX0.9VxZ2f5oV97aZ5cetiKXwKPa9yTpY9a0u8ewZOV_Fz4";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const BACKEND_URL = envUrl?.trim() ? envUrl : FALLBACK_BACKEND_URL;
const PUBLISHABLE_KEY = envKey?.trim() ? envKey : FALLBACK_PUBLISHABLE_KEY;

if (!envUrl || !envKey) {
  console.warn("[backend] Missing env vars in build, using fallback config.");
}

export const supabase = createClient<Database>(BACKEND_URL, PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
