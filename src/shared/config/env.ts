export type DataMode = "mock" | "supabase";

interface ViteEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_DATA_MODE?: string;
  PROD?: boolean;
}

const env = import.meta.env as unknown as ViteEnv;
const rawDataMode = String(env.VITE_DATA_MODE ?? "").trim();
const dataMode = (rawDataMode.toLowerCase() === "supabase" ? "supabase" : "mock") as DataMode;
const supabaseUrl = String(env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = String(env.VITE_SUPABASE_ANON_KEY ?? "").trim();

const supabaseUrl = String(env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = String(env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const rawDataMode = String(env.VITE_DATA_MODE ?? "").trim().toLowerCase();

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

function resolveDataMode(): DataMode {
  if (rawDataMode === "mock") return "mock";
  if (rawDataMode === "supabase") return "supabase";

  if (env.PROD && hasSupabaseConfig) {
    return "supabase";
  }

  return "mock";
}

export const appConfig = {
  supabaseUrl,
  supabaseAnonKey,
  dataMode,
  dataMode: resolveDataMode(),
  rawDataMode,
  isProduction: Boolean(env.PROD),
};

export function isSupabaseConfigured() {
  return hasSupabaseConfig;
}

export function isSupabaseMode() {
  return appConfig.dataMode === "supabase";
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

  return "Modo Supabase ativo exige VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.";
}

export const runtimeEnvDiagnostics = {
  dataMode: appConfig.dataMode,
  rawDataMode,
  isProduction: Boolean(env.PROD),
  hasSupabaseUrl: Boolean(appConfig.supabaseUrl),
  hasSupabaseAnonKey: Boolean(appConfig.supabaseAnonKey),
  isSupabaseConfigured: isSupabaseConfigured(),
  isSupabaseMode: isSupabaseMode(),
};
