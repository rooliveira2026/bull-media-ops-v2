export type DataMode = "mock" | "supabase";

interface ViteEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_DATA_MODE?: string;
  PROD?: boolean;
}

const env = import.meta.env as unknown as ViteEnv;

const supabaseUrl = String(env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = String(env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const rawDataMode = String(env.VITE_DATA_MODE ?? "").trim().toLowerCase();
const isProduction = Boolean(env.PROD);
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

function resolveDataMode(): DataMode {
  if (isProduction) return "supabase";

  if (rawDataMode === "supabase") return "supabase";
  return "mock";
}

export const appConfig = {
  supabaseUrl,
  supabaseAnonKey,
  dataMode: resolveDataMode(),
  rawDataMode,
  isProduction,
};

export const runtimeEnvDiagnostics = {
  dataMode: appConfig.dataMode,
  rawDataMode,
  hasSupabaseUrl: Boolean(supabaseUrl),
  hasSupabaseAnonKey: Boolean(supabaseAnonKey),
  isProduction,
};

export function isSupabaseConfigured() {
  return hasSupabaseConfig;
}

export function isSupabaseMode() {
  return appConfig.dataMode === "supabase";
}

export function shouldUseSupabase() {
  return isSupabaseMode() && isSupabaseConfigured();
}

export function getSupabaseConfigurationError() {
  if (!isSupabaseMode() || isSupabaseConfigured()) return null;

  return "Modo Supabase ativo exige VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.";
}
