import { createAuditEvent } from "../../../shared/audit/audit";
import { mockClients } from "../../../shared/api/mock-data";
import { getSupabaseClient } from "../../../shared/api/supabase-client";
import { isSupabaseMode } from "../../../shared/config/env";
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
import type { AuditLog, Client, ModuleAction } from "../../../shared/types/core";

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

interface MediaOpsRepository {
  listRecommendedActions(filters?: ActionFilters): Promise<RecommendedAction[]>;
  approveRecommendedAction(actionId: string, payload?: ApproveRecommendedActionPayload): Promise<RecommendedAction>;
  dismissRecommendedAction(actionId: string, reason: string, profileId?: string | null): Promise<RecommendedAction>;
  moveActionToReview(actionId: string, payload?: MoveActionToReviewPayload): Promise<RecommendedAction>;
  executeRecommendedAction(actionId: string, payload?: ExecuteRecommendedActionPayload): Promise<ActionExecution>;
  markActionMonitoring(actionId: string, payload?: MarkActionMonitoringPayload): Promise<RecommendedAction>;
  registerActionResult(actionId: string, payload?: MarkActionMonitoringPayload): Promise<RecommendedAction>;
  reopenRecommendedAction(actionId: string, note?: string, profileId?: string | null): Promise<RecommendedAction>;
  listActionExecutions(actionId: string): Promise<ActionExecution[]>;
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
    actionGroupId: "group_lead_quality_about",
    parentActionId: null,
    affectedItemsCount: 8,
    groupedOccurrences: [
      "Campanha Leads Eventos · público amplo",
      "Conjunto remarketing 30 dias · formulário curto",
      "Criativo institucional · baixa qualificação comercial",
    ],
    effortLevel: "médio",
    decisionOwner: "Gestor de Mídia",
    recommendationType: "Qualificação de captação",
    metadata: { source: "mock_repository" },
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
    actionGroupId: "group_booking_scale_intercity",
    parentActionId: null,
    affectedItemsCount: 4,
    groupedOccurrences: [
      "Brand Search · termos de alta intenção",
      "Campanha reservas diretas · dispositivo mobile",
      "Remarketing hóspedes recentes · janela curta",
    ],
    effortLevel: "baixo",
    decisionOwner: "Gestor de Conta",
    recommendationType: "Escala controlada",
    metadata: { source: "mock_repository" },
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
    actionGroupId: "group_quality_signal_bull",
    parentActionId: null,
    affectedItemsCount: 6,
    groupedOccurrences: [
      "Demand Gen · audiência founders",
      "Landing page consultoria · sessão curta",
      "Criativo operação de mídia · CTR acima da média",
    ],
    effortLevel: "alto",
    decisionOwner: "Direção de Estratégia",
    recommendationType: "Validação de qualidade",
    metadata: { source: "mock_repository" },
    createdAt: "2026-06-09T19:30:00.000Z",
    updatedAt: "2026-06-09T19:30:00.000Z",
  },
];

const executions: ActionExecution[] = [];

function assertNoError(error: unknown) {
  if (error) throw error;
}

function mapRecommendedAction(row: Record<string, any>): RecommendedAction {
  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    clientName: client?.name ?? row.client_name ?? row.client_id,
    moduleKey: "media_ops",
    sourcePlatform: row.source_platform ?? "",
    channel: row.channel ?? "",
    campaignName: row.campaign_name ?? null,
    title: row.title,
    description: row.description ?? "",
    priority: row.priority ?? "medium",
    status: row.status ?? "suggested",
    curationNote: row.curation_note ?? null,
    dismissedReason: row.dismissed_reason ?? null,
    approvedBy: row.approved_by ?? null,
    approvedAt: row.approved_at ?? null,
    executedBy: row.executed_by ?? null,
    executedAt: row.executed_at ?? null,
    recheckAt: row.recheck_at ?? null,
    expectedImpact: row.expected_impact ?? "",
    impactAssessment: row.impact_assessment ?? null,
    confidence: row.confidence === null || row.confidence === undefined ? null : Number(row.confidence),
    metricImpacted: row.metric_impacted ?? null,
    beforeValue: row.before_value === null || row.before_value === undefined ? null : Number(row.before_value),
    afterValue: row.after_value === null || row.after_value === undefined ? null : Number(row.after_value),
    actionGroupId: row.action_group_id ?? row.metadata?.actionGroupId ?? null,
    parentActionId: row.parent_action_id ?? row.metadata?.parentActionId ?? null,
    affectedItemsCount: Number(row.affected_items_count ?? row.metadata?.affectedItemsCount ?? 1),
    groupedOccurrences: row.grouped_occurrences ?? row.metadata?.groupedOccurrences ?? [],
    effortLevel: row.effort_level ?? row.metadata?.effortLevel ?? "médio",
    decisionOwner: row.decision_owner ?? row.metadata?.decisionOwner ?? null,
    recommendationType: row.recommendation_type ?? row.metadata?.recommendationType ?? "Recomendação estratégica",
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActionExecution(row: Record<string, any>): ActionExecution {
  return {
    id: row.id,
    organizationId: row.organization_id,
    actionId: row.action_id,
    clientId: row.client_id,
    profileId: row.profile_id ?? null,
    executedBy: row.executed_by ?? null,
    status: row.status,
    executionNote: row.execution_note ?? null,
    executedAt: row.executed_at,
    recheckAt: row.recheck_at ?? null,
    impactAssessment: row.impact_assessment ?? null,
    metadata: row.metadata ?? {},
  };
}

function mapMediaMetric(row: Record<string, any>): MediaMetricDaily {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    campaignId: row.campaign_id ?? null,
    date: row.date,
    periodKey: row.period_key ?? "current_month",
    sourcePlatform: row.source_platform ?? "",
    channel: row.channel ?? "",
    campaignName: row.campaign_name ?? "Consolidado",
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    cost: Number(row.cost ?? 0),
    conversions: Number(row.conversions ?? 0),
    conversionValue: Number(row.conversion_value ?? 0),
    revenue: Number(row.revenue ?? 0),
    cpc: Number(row.cpc ?? 0),
    cpa: Number(row.cpa ?? 0),
    ctr: Number(row.ctr ?? 0),
    roas: Number(row.roas ?? 0),
    rawSource: row.raw_source ?? "supabase",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapClient(row: Record<string, any>): Client {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    name: row.name,
    status: row.status,
    primaryObjective: row.primary_objective ?? "",
    businessModel: row.business_model ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function withMockFallback<T>(callback: () => Promise<T>, fallback: () => Promise<T>) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (isSupabaseMode()) throw new Error("Supabase indisponível.");
    return fallback();
  }
  try {
    return await callback();
  } catch (error) {
<<<<<<< Updated upstream
    if (isSupabaseMode()) {
      console.warn("[supabase:media_ops] leitura indisponível; retornando estado vazio:", error);
      return fallback();
    }
=======
    if (isSupabaseMode()) throw error;
>>>>>>> Stashed changes
    console.warn("[supabase:media_ops] fallback para mock:", error);
    return fallback();
  }
}

async function selectRecommendedActions(filters: ActionFilters = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  let query = supabase
    .from("recommended_actions")
    .select("*, clients(name)")
    .eq("module_key", "media_ops")
    .order("created_at", { ascending: false });

  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.channel) query = query.eq("channel", filters.channel);
  if (filters.sourcePlatform) query = query.eq("source_platform", filters.sourcePlatform);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.search?.trim()) {
    const search = filters.search.trim();
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,campaign_name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  assertNoError(error);
  return (data ?? []).map(mapRecommendedAction);
}

async function selectMediaMetrics(period: MediaPeriod) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  let query = supabase
    .from("media_metrics_daily")
    .select("*")
    .order("date", { ascending: false });

  query = period === "last_30d" ? query.in("period_key", ["last_30d", "current_month"]) : query.eq("period_key", period);

  const { data, error } = await query;
  assertNoError(error);
  return (data ?? []).map(mapMediaMetric);
}

async function selectMediaClients() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  assertNoError(error);
  return (data ?? []).map(mapClient);
}

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

function summarizeClients(
  rows: MediaMetricDaily[],
  currentActions = actions,
  clientList: Pick<Client, "id" | "name">[] = mockClients,
): ClientMediaSummary[] {
  return clientList.map((client) => {
    const clientRows = rows.filter((row) => row.clientId === client.id);
    const cost = sum(clientRows, "cost");
    const conversions = sum(clientRows, "conversions");
    const revenue = sum(clientRows, "revenue");
    const clientActions = currentActions.filter((action) => action.clientId === client.id);
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
          ? "Cliente em acompanhamento por oportunidade de eficiência."
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
<<<<<<< Updated upstream
  const [supabaseRows, supabaseClients, currentActions] = await Promise.all([
    isSupabaseMode()
      ? withMockFallback(() => selectMediaMetrics(period), () => Promise.resolve<MediaMetricDaily[] | null>([]))
      : Promise.resolve<MediaMetricDaily[] | null>(null),
    isSupabaseMode()
      ? withMockFallback(() => selectMediaClients(), () => Promise.resolve<Client[] | null>([]))
      : Promise.resolve<Client[] | null>(null),
    listRecommendedActions(),
  ]);
  const rows = supabaseRows ?? rowsForPeriod(period);
=======
  let rows: MediaMetricDaily[];
  let clientList: Pick<Client, "id" | "name">[];
  let currentActions: RecommendedAction[];

  if (isSupabaseMode()) {
    const [supabaseRows, supabaseClients, supabaseActions] = await Promise.all([
      selectMediaMetrics(period).catch((error): MediaMetricDaily[] => {
        console.warn("[supabase:media_ops] métricas indisponíveis; retornando vazio:", error);
        return [];
      }),
      selectMediaClients().catch((error): Client[] => {
        console.warn("[supabase:media_ops] clientes indisponíveis; retornando vazio:", error);
        return [];
      }),
      listRecommendedActions(),
    ]);
    rows = supabaseRows ?? [];
    clientList = supabaseClients ?? [];
    currentActions = supabaseActions;
  } else {
    rows = rowsForPeriod(period);
    clientList = mockClients;
    currentActions = await listRecommendedActions();
  }

>>>>>>> Stashed changes
  const cost = sum(rows, "cost");
  const conversions = sum(rows, "conversions");
  const revenue = sum(rows, "revenue");
  const topChannels = summarizeChannel(rows);
<<<<<<< Updated upstream
  const clients = summarizeClients(rows, currentActions, supabaseClients ?? mockClients);
=======
  const clients = summarizeClients(rows, currentActions, clientList ?? []);
>>>>>>> Stashed changes

  return {
    period,
    updatedAt: new Date().toISOString(),
    summary: {
      monitoredClients: clients.length,
      activeChannels: topChannels.length,
      accountsForReview: clients.filter((client) => client.status === "review").length,
      recommendedActions: currentActions.filter((action) => action.status !== "executed").length,
      cost,
      conversions,
      revenue,
      cpa: conversions ? cost / conversions : 0,
      roas: cost ? revenue / cost : 0,
    },
    topChannels,
    clients,
    actions: currentActions,
  };
}

export async function getClientMediaSummary(clientId: string, period: MediaPeriod = "last_30d") {
  const currentActions = await listRecommendedActions();
<<<<<<< Updated upstream
  const rows = isSupabaseMode()
    ? (await withMockFallback(() => selectMediaMetrics(period), () => Promise.resolve<MediaMetricDaily[] | null>([])) ?? [])
    : rowsForPeriod(period);
  const clients = isSupabaseMode()
    ? (await withMockFallback(() => selectMediaClients(), () => Promise.resolve<Client[] | null>([])) ?? [])
    : mockClients;
  return summarizeClients(rows, currentActions, clients).find((client) => client.clientId === clientId) ?? null;
}

export async function getChannelSummary(clientId?: string, period: MediaPeriod = "last_30d") {
  const periodRows = isSupabaseMode()
    ? (await withMockFallback(() => selectMediaMetrics(period), () => Promise.resolve<MediaMetricDaily[] | null>([])) ?? [])
    : rowsForPeriod(period);
  const rows = periodRows.filter((row) => !clientId || row.clientId === clientId);
=======
  const rows = isSupabaseMode() ? await selectMediaMetrics(period).catch(() => []) : rowsForPeriod(period);
  const clientList = isSupabaseMode() ? await selectMediaClients().catch(() => []) : mockClients;
  return summarizeClients(rows ?? [], currentActions, clientList ?? []).find((client) => client.clientId === clientId) ?? null;
}

export async function getChannelSummary(clientId?: string, period: MediaPeriod = "last_30d") {
  const periodRows = isSupabaseMode() ? await selectMediaMetrics(period).catch(() => []) : rowsForPeriod(period);
  const rows = (periodRows ?? []).filter((row) => !clientId || row.clientId === clientId);
>>>>>>> Stashed changes
  return summarizeChannel(rows);
}

export async function listRecommendedActions(filters: ActionFilters = {}) {
  if (isSupabaseMode()) {
    try {
      return await selectRecommendedActions(filters) ?? [];
    } catch (error) {
      console.warn("[supabase:media_ops] ações indisponíveis; retornando vazio:", error);
      return [];
    }
  }
  return withMockFallback(async () => {
    const result = await selectRecommendedActions(filters);
    return result ?? (isSupabaseMode() ? [] : listRecommendedActionsMock(filters));
  }, () => Promise.resolve(isSupabaseMode() ? [] : listRecommendedActionsMock(filters)));
}

function listRecommendedActionsMock(filters: ActionFilters = {}) {
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
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data, error } = await supabase
      .from("recommended_actions")
      .update({
        status: "approved",
        curation_note: payload.curationNote ?? null,
        dismissed_reason: null,
        approved_by: payload.profileId ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", actionId)
      .select("*, clients(name)")
      .single();
    assertNoError(error);
    const action = mapRecommendedAction(data);
    await auditAction(action, "approve_recommended_action", payload.profileId, { curationNote: payload.curationNote ?? null });
    return action;
  }, async () => {
    const action = updateAction(findAction(actionId), {
    status: "approved",
    curationNote: payload.curationNote ?? null,
    dismissedReason: null,
    approvedBy: payload.profileId ?? null,
    approvedAt: new Date().toISOString(),
    });
    await auditAction(action, "approve_recommended_action", payload.profileId, { curationNote: payload.curationNote ?? null });
    return action;
  });
}

export async function dismissRecommendedAction(actionId: string, reason: string, profileId: string | null = "user_rodrigo") {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data, error } = await supabase
      .from("recommended_actions")
      .update({ status: "dismissed", dismissed_reason: reason })
      .eq("id", actionId)
      .select("*, clients(name)")
      .single();
    assertNoError(error);
    const action = mapRecommendedAction(data);
    await auditAction(action, "dismiss_recommended_action", profileId, { reason });
    return action;
  }, async () => {
    const action = updateAction(findAction(actionId), {
      status: "dismissed",
      dismissedReason: reason,
    });
    await auditAction(action, "dismiss_recommended_action", profileId, { reason });
    return action;
  });
}

export async function moveActionToReview(actionId: string, payload: MoveActionToReviewPayload = {}) {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data, error } = await supabase
      .from("recommended_actions")
      .update({ status: "in_review", curation_note: payload.note ?? null, dismissed_reason: null })
      .eq("id", actionId)
      .select("*, clients(name)")
      .single();
    assertNoError(error);
    const action = mapRecommendedAction(data);
    await auditAction(action, "move_action_to_review", payload.profileId, { note: payload.note ?? null });
    return action;
  }, async () => {
    const action = updateAction(findAction(actionId), {
      status: "in_review",
      curationNote: payload.note ?? null,
      dismissedReason: null,
    });
    await auditAction(action, "move_action_to_review", payload.profileId, { note: payload.note ?? null });
    return action;
  });
}

export async function executeRecommendedAction(
  actionId: string,
  payload: ExecuteRecommendedActionPayload = {},
): Promise<ActionExecution> {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data: actionRow, error: actionError } = await supabase
      .from("recommended_actions")
      .update({
        status: "executed",
        executed_by: payload.executedBy ?? payload.profileId ?? null,
        executed_at: new Date().toISOString(),
        recheck_at: payload.recheckAt ?? null,
      })
      .eq("id", actionId)
      .select("*, clients(name)")
      .single();
    assertNoError(actionError);
    const action = mapRecommendedAction(actionRow);

    const { data, error } = await supabase
      .from("action_executions")
      .insert({
        organization_id: action.organizationId,
        action_id: actionId,
        client_id: action.clientId,
        profile_id: payload.profileId ?? null,
        executed_by: payload.executedBy ?? payload.profileId ?? null,
        status: "executed",
        execution_note: payload.executionNote ?? null,
        recheck_at: payload.recheckAt ?? null,
        metadata: { source: "supabase_repository" },
      })
      .select("*")
      .single();
    assertNoError(error);
    const execution = mapActionExecution(data);

    await auditAction(action, "execute_recommended_action", payload.profileId, {
      executionId: execution.id,
      recheckAt: execution.recheckAt,
    });

    return execution;
  }, async () => {
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
  });
}

export async function markActionMonitoring(actionId: string, payload: MarkActionMonitoringPayload = {}) {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data, error } = await supabase
      .from("recommended_actions")
      .update({
        status: "monitoring",
        impact_assessment: payload.impactAssessment ?? null,
        after_value: payload.afterValue ?? null,
        recheck_at: payload.recheckAt ?? null,
      })
      .eq("id", actionId)
      .select("*, clients(name)")
      .single();
    assertNoError(error);
    const action = mapRecommendedAction(data);
    await auditAction(action, "mark_action_monitoring", payload.profileId, {
      impactAssessment: payload.impactAssessment ?? null,
      afterValue: payload.afterValue ?? null,
    });
    return action;
  }, async () => {
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
  });
}

export async function registerActionResult(actionId: string, payload: MarkActionMonitoringPayload = {}) {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data, error } = await supabase
      .from("recommended_actions")
      .update({
        status: "executed",
        impact_assessment: payload.impactAssessment ?? null,
        after_value: payload.afterValue ?? null,
      })
      .eq("id", actionId)
      .select("*, clients(name)")
      .single();
    assertNoError(error);
    const action = mapRecommendedAction(data);
    await auditAction(action, "register_action_result", payload.profileId, {
      impactAssessment: payload.impactAssessment ?? null,
      afterValue: payload.afterValue ?? null,
    });
    return action;
  }, async () => {
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
  });
}

export async function reopenRecommendedAction(actionId: string, note = "Ação reaberta para nova avaliação.", profileId: string | null = "user_rodrigo") {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data, error } = await supabase
      .from("recommended_actions")
      .update({ status: "in_review", curation_note: note, dismissed_reason: null })
      .eq("id", actionId)
      .select("*, clients(name)")
      .single();
    assertNoError(error);
    const action = mapRecommendedAction(data);
    await auditAction(action, "reopen_recommended_action", profileId, { note });
    return action;
  }, async () => {
    const action = updateAction(findAction(actionId), {
      status: "in_review",
      curationNote: note,
      dismissedReason: null,
    });
    await auditAction(action, "reopen_recommended_action", profileId, { note });
    return action;
  });
}

export async function listActionExecutions(actionId: string): Promise<ActionExecution[]> {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data, error } = await supabase
      .from("action_executions")
      .select("*")
      .eq("action_id", actionId)
      .order("executed_at", { ascending: false });
    assertNoError(error);
    return (data ?? []).map(mapActionExecution);
  }, () => Promise.resolve(executions.filter((execution) => execution.actionId === actionId)));
}

export async function listActionAuditEvents(actionId: string): Promise<AuditLog[]> {
  return listAuditLogs({ entityType: "recommended_action", entityId: actionId });
}
