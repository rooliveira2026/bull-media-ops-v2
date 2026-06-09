export type DataMode = "mock" | "supabase";

interface ViteEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_DATA_MODE?: DataMode;
}

const env = import.meta.env as unknown as ViteEnv;

export const appConfig = {
  supabaseUrl: env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? "",
  dataMode: env.VITE_DATA_MODE ?? "mock",
};

export function isSupabaseConfigured() {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
}

export function shouldUseSupabase() {
  return appConfig.dataMode === "supabase" && isSupabaseConfigured();
}
