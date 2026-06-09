import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { appConfig, shouldUseSupabase } from "../config/env";

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!shouldUseSupabase()) return null;
  if (!client) {
    client = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}

export function requireSupabaseClient() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase não está configurado para este ambiente.");
  }
  return supabase;
}
