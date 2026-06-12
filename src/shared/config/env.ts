export type DataMode = "mock" | "supabase";

interface ViteEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_DATA_MODE?: string;
  PROD?: boolean;
}

const env = import.meta.env as unknown as ViteEnv;
const rawDataMode = String(env.VITE_DATA_MODE ?? "").trim();
const normalizedDataMode = rawDataMode.toLowerCase();
const supabaseUrl = String(env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = String(env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const isProduction = Boolean(env.PROD);
const resolvedDataMode = (isProduction || normalizedDataMode === "supabase" ? "supabase" : "mock") as DataMode;

export const appConfig = {
  supabaseUrl,
  supabaseAnonKey,
  dataMode: resolvedDataMode,
  rawDataMode,
  isProduction,
};

export function isSupabaseConfigured() {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
}

export function isSupabaseMode() {
  return appConfig.dataMode === "supabase";
}

export function isProductionMode() {
  return appConfig.isProduction;
}

export function shouldUseSupabase() {
  return isSupabaseMode() && isSupabaseConfigured();
}

export function getSupabaseConfigurationError() {
  if (!isSupabaseMode() || isSupabaseConfigured()) return null;
  return "Modo Supabase/produção exige VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.";
}

export const runtimeEnvDiagnostics = {
  dataMode: appConfig.dataMode,
  rawDataMode: appConfig.rawDataMode,
  isProduction: appConfig.isProduction,
  hasSupabaseUrl: Boolean(appConfig.supabaseUrl),
  hasSupabaseAnonKey: Boolean(appConfig.supabaseAnonKey),
  isSupabaseConfigured: isSupabaseConfigured(),
  isSupabaseMode: isSupabaseMode(),
};
