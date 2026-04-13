import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const FALLBACK_BACKEND_URL = "https://ggdxcuvmdxznfzttbhss.supabase.co";
const FALLBACK_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZHhjdXZtZHh6bmZ6dHRiaHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDYwMTcsImV4cCI6MjA5MTU4MjAxN30.pObck8t9rF3efv401xGmcKT88yVvow65ItBrKomi8X0";

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
