import { groupRecommendedActions } from "./group-actions";
import {
  buildImportBatchSummary,
  detectSourceType,
  normalizeChannel,
  normalizeClientObjective,
  normalizeCurrency,
  normalizeDateRange,
  normalizeMetricValue,
  sanitizeClientLanguage,
} from "./normalizers";

interface V1Export {
  export_id: string;
  source: string;
  organization_id: string;
  period: { start: string; end: string };
  clients: Array<{
    id: string;
    name: string;
    objective: string;
    currency?: string;
    channels?: string[];
  }>;
  metrics: Array<Record<string, unknown>>;
  recommended_actions: Array<any>;
  reports?: Array<Record<string, unknown>>;
  pdm?: Array<Record<string, unknown>>;
  client_intelligence?: Array<Record<string, unknown>>;
}

export function normalizeV1Export(payload: V1Export) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const period = normalizeDateRange(payload.period);
  const sourceType = detectSourceType(payload.source);

  const clients = payload.clients.map((client) => ({
    client_id: client.id,
    name: sanitizeClientLanguage(client.name),
    objective: normalizeClientObjective(client.objective),
    currency: normalizeCurrency(client.currency),
    channels: (client.channels ?? []).map(normalizeChannel),
  }));

  const metrics = payload.metrics.map((metric) => ({
    client_id: String(metric.client_id ?? ""),
    channel: normalizeChannel(metric.channel),
    date: String(metric.date ?? period.end ?? ""),
    cost: normalizeMetricValue(metric.cost),
    clicks: normalizeMetricValue(metric.clicks),
    impressions: normalizeMetricValue(metric.impressions),
    conversions: normalizeMetricValue(metric.conversions),
    revenue: normalizeMetricValue(metric.revenue),
  }));

  const groupedActions = groupRecommendedActions(payload.recommended_actions ?? []);
  if ((payload.recommended_actions ?? []).length !== groupedActions.length) {
    warnings.push(`${payload.recommended_actions.length} ocorrências técnicas agrupadas em ${groupedActions.length} recomendações-mãe.`);
  }

  const received =
    payload.clients.length +
    payload.metrics.length +
    (payload.recommended_actions ?? []).length +
    (payload.reports ?? []).length +
    (payload.pdm ?? []).length +
    (payload.client_intelligence ?? []).length;

  return {
    importId: payload.export_id,
    organizationId: payload.organization_id,
    period,
    dataSource: {
      source_type: sourceType,
      source_name: "Exportação controlada V1",
      status: "validating",
      account_id: payload.export_id,
      account_name: "V1 Google Sheets",
      currency: clients[0]?.currency ?? "BRL",
      timezone: "America/Sao_Paulo",
      metadata: { source: payload.source, period },
    },
    clients,
    metrics,
    recommendedActions: groupedActions,
    reports: payload.reports ?? [],
    pdm: payload.pdm ?? [],
    clientIntelligence: payload.client_intelligence ?? [],
    qualityLogs: warnings.map((message) => ({
      severity: "attention",
      entity_type: "recommended_action",
      message,
      metadata: { sourceType },
    })),
    batch: buildImportBatchSummary({
      recordsReceived: received,
      recordsImported: clients.length + metrics.length + groupedActions.length,
      warnings,
      errors,
    }),
  };
}
