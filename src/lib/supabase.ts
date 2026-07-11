import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { CONFIG } from "./config";

export const supabase = createClient<Database>(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "implicit",
    },
  },
);

/**
 * Helper to get the current user's ID or null if not logged in.
 */
export function getCurrentUserId(): string | null {
  return supabase.auth.getSession().then(({ data }) => data.session?.user?.id ?? null).catch(() => null);
}