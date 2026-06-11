import type { ClientObjective } from "../../shared/api/client-config";
import type { RecommendedActionPriority, RecommendedActionStatus } from "../../modules/media-ops/types";
import type { SourceType } from "../../modules/integrations/types";

const channelMap: Record<string, string> = {
  google: "Google Ads",
  google_ads: "Google Ads",
  meta: "Meta Ads",
  facebook: "Meta Ads",
  instagram: "Meta Ads",
  linkedin: "LinkedIn Ads",
  ga4: "GA4",
  clickup: "ClickUp",
  sheets: "Google Sheets legado",
};

const languageMap: Array<[RegExp, string]> = [
  [/conta crítica/gi, "em acompanhamento"],
  [/crítico|crítica/gi, "atenção estratégica"],
  [/problema/gi, "ponto de atenção"],
  [/falha/gi, "ponto a validar"],
  [/desperdício/gi, "oportunidade de eficiência"],
  [/tráfego irrelevante/gi, "tráfego com menor aderência ao perfil ideal"],
];

export function normalizeCurrency(value: unknown, fallback = "BRL") {
  if (typeof value !== "string") return fallback;
  const upper = value.trim().toUpperCase();
  return upper === "USD" || upper === "BRL" ? upper : fallback;
}

export function normalizeDateRange(input: { start?: string; end?: string }) {
  return {
    start: input.start ? new Date(input.start).toISOString().slice(0, 10) : null,
    end: input.end ? new Date(input.end).toISOString().slice(0, 10) : null,
  };
}

export function normalizeChannel(value: unknown) {
  const key = String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return channelMap[key] ?? channelMap[key.split("_")[0]] ?? "Canal a validar";
}

export function normalizeClientObjective(value: unknown): ClientObjective {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("lead")) return "lead_generation";
  if (key.includes("receita") || key.includes("revenue")) return "revenue";
  if (key.includes("awareness") || key.includes("alcance")) return "awareness";
  if (key.includes("traffic") || key.includes("tráfego")) return "traffic";
  if (key.includes("booking") || key.includes("reserva")) return "booking";
  if (key.includes("whatsapp") || key.includes("conversa")) return "whatsapp";
  return "lead_generation";
}

export function normalizePriority(value: unknown): RecommendedActionPriority {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("alta") || key.includes("high")) return "high";
  if (key.includes("baixa") || key.includes("low")) return "low";
  return "medium";
}

export function normalizeStatus(value: unknown): RecommendedActionStatus {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("aprov")) return "approved";
  if (key.includes("exec")) return "executed";
  if (key.includes("monitor")) return "monitoring";
  if (key.includes("descart")) return "dismissed";
  if (key.includes("avalia") || key.includes("review")) return "in_review";
  return "suggested";
}

export function normalizeMetricValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "0").replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sanitizeClientLanguage(text: unknown) {
  return languageMap.reduce((current, [pattern, replacement]) => {
    return current.replace(pattern, replacement);
  }, String(text ?? ""));
}

export function detectSourceType(value: unknown): SourceType {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("v1") || key.includes("sheet") || key.includes("planilha")) return "legacy_v1_export";
  if (key.includes("google")) return "google_ads_api";
  if (key.includes("meta") || key.includes("facebook") || key.includes("instagram")) return "meta_ads_api";
  if (key.includes("ga4") || key.includes("analytics")) return "ga4_api";
  if (key.includes("linkedin")) return "linkedin_ads_api";
  if (key.includes("clickup")) return "clickup_api";
  return "manual_input";
}

export interface ImportBatchSummaryInput {
  recordsReceived: number;
  recordsImported: number;
  warnings: string[];
  errors: string[];
}

export function buildImportBatchSummary(input: ImportBatchSummaryInput) {
  return {
    status: input.errors.length > 0
      ? "failed"
      : input.warnings.length > 0
        ? "completed_with_warnings"
        : "completed",
    recordsReceived: input.recordsReceived,
    recordsImported: input.recordsImported,
    recordsSkipped: Math.max(input.recordsReceived - input.recordsImported, 0),
    warnings: input.warnings,
    errors: input.errors,
  };
}
