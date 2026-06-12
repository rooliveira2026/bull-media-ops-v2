import { runtimeEnvDiagnostics } from "../config/env";

export function RuntimeEnvBadge() {
  return (
    <div className="runtime-env-badge" aria-label="Diagnóstico seguro de ambiente">
      <span>build: final-auth-gate</span>
      <span>mode: {runtimeEnvDiagnostics.dataMode}</span>
      <span>raw: {runtimeEnvDiagnostics.rawDataMode || "empty"}</span>
      <span>url: {runtimeEnvDiagnostics.hasSupabaseUrl ? "ok" : "missing"}</span>
      <span>anon: {runtimeEnvDiagnostics.hasSupabaseAnonKey ? "ok" : "missing"}</span>
      <span>prod: {runtimeEnvDiagnostics.isProduction ? "yes" : "no"}</span>
    </div>
  );
}
