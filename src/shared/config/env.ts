export type DataMode = "mock" | "supabase";

interface ViteEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_DATA_MODE?: string;
}

const env = import.meta.env as unknown as ViteEnv;
const normalizedDataMode = String(env.VITE_DATA_MODE ?? "mock").trim().toLowerCase();

export const appConfig = {
  supabaseUrl: String(env.VITE_SUPABASE_URL ?? "").trim(),
  supabaseAnonKey: String(env.VITE_SUPABASE_ANON_KEY ?? "").trim(),
  dataMode: (normalizedDataMode === "supabase" ? "supabase" : "mock") as DataMode,
};

export function isSupabaseConfigured() {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
}

export function isSupabaseMode() {
  return appConfig.dataMode === "supabase";
}

export function shouldUseSupabase() {
  return isSupabaseMode() && isSupabaseConfigured();
}

export function getSupabaseConfigurationError() {
  if (!isSupabaseMode() || isSupabaseConfigured()) return null;
  return "VITE_DATA_MODE=supabase exige VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.";
}
