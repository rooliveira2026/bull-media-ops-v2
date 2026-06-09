import { createAuditEvent } from "../../../shared/audit/audit";
import { mockClients } from "../../../shared/api/mock-data";
import { listAuditLogs } from "../../core/api/core-repository";
import { mockV1MediaRows, normalizeV1MediaRowsToV2 } from "../importers/v1-importer";
import type {
  ActionExecution,
  ApproveRecommendedActionPayload,
  ChannelSummary,
  ClientMediaSummary,
  ExecuteRecommendedActionPayload,
  MarkActionMonitoringPayload,
  MediaMetricDaily,
  MediaOverview,
  MediaPeriod,
  MoveActionToReviewPayload,
  RecommendedAction,
  RecommendedActionPriority,
  RecommendedActionStatus,
} from "../types";
import type { AuditLog, ModuleAction } from "../../../shared/types/core";

interface OverviewParams {
  period?: MediaPeriod;
}

interface ActionFilters {
  clientId?: string;
  channel?: string;
  sourcePlatform?: string;
  status?: RecommendedActionStatus | "all";
  priority?: RecommendedActionPriority;
  search?: string;
}

const organizationId = "org_bull";
const metrics: MediaMetricDaily[] = normalizeV1MediaRowsToV2(mockV1MediaRows);

const actions: RecommendedAction[] = [
  {
    id: "action_media_001",
    organizationId,
    clientId: "client_about",
    clientName: "About Events",
    moduleKey: "media_ops",
    sourcePlatform: "meta_ads",
    channel: "Meta Ads",
    campaignName: "Leads Eventos",
    title: "Revisar qualidade dos leads em campanhas sociais",
    description: "Cruzar formulários, públicos e qualidade comercial antes de ampliar orçamento.",
    priority: "high",
    status: "suggested",
    curationNote: null,
    dismissedReason: null,
    approvedBy: null,
    approvedAt: null,
    executedBy: null,
    executedAt: null,
    recheckAt: null,
    expectedImpact: "Melhorar eficiência de aquisição e reduzir dispersão de leads.",
    impactAssessment: null,
    confidence: 0.82,
    metricImpacted: "CPA",
    beforeValue: 194.32,
    afterValue: null,
    metadata: { source: "v1_import_mock" },
    createdAt: "2026-06-09T19:30:00.000Z",
    updatedAt: "2026-06-09T19:30:00.000Z",
  },
  {
    id: "action_media_002",
    organizationId,
    clientId: "client_intercity",
    clientName: "Intercity Batel",
    moduleKey: "media_ops",
    sourcePlatform: "google_ads",
    channel: "Google Ads",
    campaignName: "Brand Search",
    title: "Ampliar verba em campanhas com maior intenção",
    description: "Escalar gradualmente campanhas de busca com ROAS consistente e CPA controlado.",
    priority: "medium",
    status: "approved",
    curationNote: "Aprovada para execução controlada com reavaliação em 14 dias.",
    dismissedReason: null,
    approvedBy: "user_rodrigo",
    approvedAt: "2026-06-09T19:36:00.000Z",
    executedBy: null,
    executedAt: null,
    recheckAt: null,
    expectedImpact: "Aumentar reservas diretas preservando eficiência.",
    impactAssessment: null,
    confidence: 0.76,
    metricImpacted: "ROAS",
    beforeValue: 5.27,
    afterValue: null,
    metadata: { source: "v1_import_mock" },
    createdAt: "2026-06-09T19:30:00.000Z",
    updatedAt: "2026-06-09T19:30:00.000Z",
  },
  {
    id: "action_media_003",
    organizationId,
    clientId: "client_bull",
    clientName: "Bull Digital",
    moduleKey: "media_ops",
    sourcePlatform: "linkedin_ads",
    channel: "LinkedIn Ads",
    campaignName: "Demand Gen",
    title: "Validar correlação entre mídia e qualidade pós-clique",
    description: "Comparar campanhas de demanda com sinais de navegação antes de expandir audiência.",
    priority: "high",
    status: "in_review",
    curationNote: "Validar qualidade dos sinais antes de aprovar a próxima etapa.",
    dismissedReason: null,
    approvedBy: null,
    approvedAt: null,
    executedBy: null,
    executedAt: null,
    recheckAt: null,
    expectedImpact: "Gerar oportunidade de evolução com menor risco de investimento.",
    impactAssessment: null,
    confidence: 0.71,
    metricImpacted: "Taxa de conversão",
    beforeValue: 0.0304,
    afterValue: null,
    metadata: { source: "v1_import_mock" },
    createdAt: "2026-06-09T19:30:00.000Z",
    updatedAt: "2026-06-09T19:30:00.000Z",
  },
];

const executions: ActionExecution[] = [];

function sum(rows: MediaMetricDaily[], key: "cost" | "conversions" | "revenue" | "clicks" | "impressions") {
  return rows.reduce((total, row) => total + row[key], 0);
}

function summarizeChannel(rows: MediaMetricDaily[]): ChannelSummary[] {
  const grouped = new Map<string, MediaMetricDaily[]>();
  rows.forEach((row) => {
    const current = grouped.get(row.channel) ?? [];
    current.push(row);
    grouped.set(row.channel, current);
  });

  return Array.from(grouped.entries())
    .map(([channel, group]) => {
      const cost = sum(group, "cost");
      const conversions = sum(group, "conversions");
      const revenue = sum(group, "revenue");
      return {
        channel,
        cost,
        conversions,
        revenue,
        cpa: conversions ? cost / conversions : 0,
        roas: cost ? revenue / cost : 0,
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

function summarizeClients(rows: MediaMetricDaily[]): ClientMediaSummary[] {
  return mockClients.map((client) => {
    const clientRows = rows.filter((row) => row.clientId === client.id);
    const cost = sum(clientRows, "cost");
    const conversions = sum(clientRows, "conversions");
    const revenue = sum(clientRows, "revenue");
    const clientActions = actions.filter((action) => action.clientId === client.id);
    const roas = cost ? revenue / cost : 0;
    const cpa = conversions ? cost / conversions : 0;
    const status =
      cpa > 180
        ? "review"
        : roas >= 4
          ? "evolution_opportunity"
          : "strategic_attention";

    return {
      clientId: client.id,
      clientName: client.name,
      status,
      cost,
      conversions,
      revenue,
      cpa,
      roas,
      activeChannels: new Set(clientRows.map((row) => row.channel)).size,
      recommendedActions: clientActions.length,
      mainReading:
        status === "review"
          ? "Conta para revisão por eficiência abaixo do alvo operacional."
          : status === "evolution_opportunity"
            ? "Oportunidade de evolução com sinais positivos de retorno."
            : "Atenção estratégica para validar próximos ajustes.",
    };
  });
}

function rowsForPeriod(period: MediaPeriod) {
  return metrics.filter((row) => row.periodKey === period);
}

export async function getMediaOverview(params: OverviewParams = {}): Promise<MediaOverview> {
  const period = params.period ?? "last_30d";
  const rows = rowsForPeriod(period);
  const cost = sum(rows, "cost");
  const conversions = sum(rows, "conversions");
  const revenue = sum(rows, "revenue");
  const topChannels = summarizeChannel(rows);
  const clients = summarizeClients(rows);

  return {
    period,
    updatedAt: new Date().toISOString(),
    summary: {
      monitoredClients: clients.length,
      activeChannels: topChannels.length,
      accountsForReview: clients.filter((client) => client.status === "review").length,
      recommendedActions: actions.filter((action) => action.status !== "executed").length,
      cost,
      conversions,
      revenue,
      cpa: conversions ? cost / conversions : 0,
      roas: cost ? revenue / cost : 0,
    },
    topChannels,
    clients,
    actions,
  };
}

export async function getClientMediaSummary(clientId: string, period: MediaPeriod = "last_30d") {
  return summarizeClients(rowsForPeriod(period)).find((client) => client.clientId === clientId) ?? null;
}

export async function getChannelSummary(clientId?: string, period: MediaPeriod = "last_30d") {
  const rows = rowsForPeriod(period).filter((row) => !clientId || row.clientId === clientId);
  return summarizeChannel(rows);
}

export async function listRecommendedActions(filters: ActionFilters = {}) {
  return actions.filter((action) => {
    const clientMatches = !filters.clientId || action.clientId === filters.clientId;
    const channelMatches = !filters.channel || action.channel === filters.channel;
    const sourceMatches = !filters.sourcePlatform || action.sourcePlatform === filters.sourcePlatform;
    const statusMatches = !filters.status || filters.status === "all" || action.status === filters.status;
    const priorityMatches = !filters.priority || action.priority === filters.priority;
    const search = filters.search?.trim().toLowerCase();
    const searchMatches = !search || [action.title, action.description, action.clientName, action.channel, action.campaignName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search);
    return clientMatches && channelMatches && sourceMatches && statusMatches && priorityMatches && searchMatches;
  });
}

function findAction(actionId: string) {
  const action = actions.find((item) => item.id === actionId);
  if (!action) {
    throw new Error("Ação recomendada não encontrada.");
  }
  return action;
}

async function auditAction(action: RecommendedAction, actionKey: ModuleAction, profileId?: string | null, metadata: Record<string, unknown> = {}) {
  await createAuditEvent({
    organizationId: action.organizationId,
    clientId: action.clientId,
    profileId: profileId ?? null,
    moduleKey: "media_ops",
    actionKey,
    entityType: "recommended_action",
    entityId: action.id,
    metadata: {
      status: action.status,
      ...metadata,
    },
  });
}

function updateAction(action: RecommendedAction, patch: Partial<RecommendedAction>) {
  Object.assign(action, patch, { updatedAt: new Date().toISOString() });
  return action;
}

export async function approveRecommendedAction(actionId: string, payload: ApproveRecommendedActionPayload = {}) {
  const action = updateAction(findAction(actionId), {
    status: "approved",
    curationNote: payload.curationNote ?? null,
    dismissedReason: null,
    approvedBy: payload.profileId ?? null,
    approvedAt: new Date().toISOString(),
  });
  await auditAction(action, "approve_recommended_action", payload.profileId, { curationNote: payload.curationNote ?? null });
  return action;
}

export async function dismissRecommendedAction(actionId: string, reason: string, profileId: string | null = "user_rodrigo") {
  const action = updateAction(findAction(actionId), {
    status: "dismissed",
    dismissedReason: reason,
  });
  await auditAction(action, "dismiss_recommended_action", profileId, { reason });
  return action;
}

export async function moveActionToReview(actionId: string, payload: MoveActionToReviewPayload = {}) {
  const action = updateAction(findAction(actionId), {
    status: "in_review",
    curationNote: payload.note ?? null,
    dismissedReason: null,
  });
  await auditAction(action, "move_action_to_review", payload.profileId, { note: payload.note ?? null });
  return action;
}

export async function executeRecommendedAction(
  actionId: string,
  payload: ExecuteRecommendedActionPayload = {},
): Promise<ActionExecution> {
  const action = findAction(actionId);

  updateAction(action, {
    status: "executed",
    executedBy: payload.executedBy ?? payload.profileId ?? null,
    executedAt: new Date().toISOString(),
    recheckAt: payload.recheckAt ?? null,
  });

  const execution: ActionExecution = {
    id: `execution_${executions.length + 1}`,
    organizationId: action.organizationId,
    actionId,
    clientId: action.clientId,
    profileId: payload.profileId ?? null,
    executedBy: payload.executedBy ?? payload.profileId ?? null,
    status: "executed",
    executionNote: payload.executionNote ?? null,
    executedAt: new Date().toISOString(),
    recheckAt: payload.recheckAt ?? null,
    impactAssessment: null,
    metadata: { source: "mock_repository" },
  };

  executions.unshift(execution);

  await auditAction(action, "execute_recommended_action", payload.profileId, {
    executionId: execution.id,
    recheckAt: execution.recheckAt,
  });

  return execution;
}

export async function markActionMonitoring(actionId: string, payload: MarkActionMonitoringPayload = {}) {
  const action = updateAction(findAction(actionId), {
    status: "monitoring",
    impactAssessment: payload.impactAssessment ?? null,
    afterValue: payload.afterValue ?? null,
    recheckAt: payload.recheckAt ?? null,
  });
  await auditAction(action, "mark_action_monitoring", payload.profileId, {
    impactAssessment: payload.impactAssessment ?? null,
    afterValue: payload.afterValue ?? null,
  });
  return action;
}

export async function registerActionResult(actionId: string, payload: MarkActionMonitoringPayload = {}) {
  const action = updateAction(findAction(actionId), {
    status: "executed",
    impactAssessment: payload.impactAssessment ?? null,
    afterValue: payload.afterValue ?? null,
  });
  await auditAction(action, "register_action_result", payload.profileId, {
    impactAssessment: payload.impactAssessment ?? null,
    afterValue: payload.afterValue ?? null,
  });
  return action;
}

export async function reopenRecommendedAction(actionId: string, note = "Ação reaberta para nova avaliação.", profileId: string | null = "user_rodrigo") {
  const action = updateAction(findAction(actionId), {
    status: "in_review",
    curationNote: note,
    dismissedReason: null,
  });
  await auditAction(action, "reopen_recommended_action", profileId, { note });
  return action;
}

export async function listActionExecutions(actionId: string): Promise<ActionExecution[]> {
  return executions.filter((execution) => execution.actionId === actionId);
}

export async function listActionAuditEvents(actionId: string): Promise<AuditLog[]> {
  return listAuditLogs({ entityType: "recommended_action", entityId: actionId });
}
