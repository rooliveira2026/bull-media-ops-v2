import { mockClients } from "../../../shared/api/mock-data";
import { getSupabaseClient } from "../../../shared/api/supabase-client";
import { isSupabaseMode } from "../../../shared/config/env";
import type { DataQualityLog, DataSourcesOverview, ImportBatch, OperationalDataSource, SourceType } from "../types";

const now = "2026-06-11T10:00:00.000Z";

const mockSources: OperationalDataSource[] = [
  {
    id: "source_legacy_v1",
    organizationId: "org_bull",
    clientId: null,
    clientName: null,
    sourceType: "legacy_v1_export",
    sourceName: "Exportação controlada V1",
    status: "validating",
    accountId: "legacy-v1",
    accountName: "Google Sheets operacional",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    lastSyncedAt: "2026-06-10T18:20:00.000Z",
    metadata: { nextStep: "Validar fixture JSON e normalizadores." },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_google_ads_api",
    organizationId: "org_bull",
    clientId: "client_intercity",
    clientName: "Intercity Batel",
    sourceType: "google_ads_api",
    sourceName: "Google Ads API",
    status: "prepared",
    accountId: null,
    accountName: null,
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    lastSyncedAt: null,
    metadata: { nextStep: "Aguardar credenciais e sprint de integração oficial." },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_meta_ads_api",
    organizationId: "org_bull",
    clientId: "client_about",
    clientName: "About Events",
    sourceType: "meta_ads_api",
    sourceName: "Meta Ads API",
    status: "pending_credentials",
    accountId: null,
    accountName: null,
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    lastSyncedAt: null,
    metadata: { nextStep: "Mapear contas e permissões antes da autorização oficial." },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "source_supabase_manual",
    organizationId: "org_bull",
    clientId: null,
    clientName: null,
    sourceType: "manual_input",
    sourceName: "Entrada manual operacional",
    status: "prepared",
    accountId: null,
    accountName: null,
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    lastSyncedAt: null,
    metadata: { nextStep: "Usar apenas para ajustes controlados em staging." },
    createdAt: now,
    updatedAt: now,
  },
];

const mockBatches: ImportBatch[] = [
  {
    id: "batch_v1_sample",
    organizationId: "org_bull",
    sourceId: "source_legacy_v1",
    sourceType: "legacy_v1_export",
    status: "completed_with_warnings",
    startedAt: "2026-06-10T18:18:00.000Z",
    finishedAt: "2026-06-10T18:20:00.000Z",
    recordsReceived: 42,
    recordsImported: 36,
    recordsSkipped: 6,
    warnings: ["6 ocorrências técnicas agrupadas em recomendações-mãe."],
    errors: [],
    checksum: "sample-v1-export",
    createdBy: "user_rodrigo",
    createdAt: "2026-06-10T18:18:00.000Z",
  },
];

const mockQualityLogs: DataQualityLog[] = [
  {
    id: "quality_001",
    organizationId: "org_bull",
    clientId: "client_about",
    sourceId: "source_legacy_v1",
    severity: "attention",
    entityType: "recommended_action",
    entityId: "group_about_search_terms",
    message: "Termos de busca agrupados por tema antes de virar recomendação ativa.",
    metadata: { groupedOccurrences: 4 },
    createdAt: "2026-06-10T18:20:00.000Z",
  },
  {
    id: "quality_002",
    organizationId: "org_bull",
    clientId: "client_intercity",
    sourceId: "source_legacy_v1",
    severity: "info",
    entityType: "metrics",
    entityId: "booking_metrics",
    message: "Moeda e datas normalizadas para leitura de reservas.",
    metadata: {},
    createdAt: "2026-06-10T18:20:00.000Z",
  },
];

function sourceLabel(sourceType: SourceType) {
  const labels: Record<SourceType, string> = {
    legacy_v1_export: "Exportação V1",
    google_ads_api: "Google Ads API",
    meta_ads_api: "Meta Ads API",
    ga4_api: "GA4 API",
    linkedin_ads_api: "LinkedIn Ads API",
    clickup_api: "ClickUp API",
    manual_input: "Entrada manual",
  };
  return labels[sourceType];
}

function mapSource(row: Record<string, any>): OperationalDataSource {
  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  return {
    id: row.id,
    organizationId: row.organization_id ?? null,
    clientId: row.client_id ?? null,
    clientName: client?.name ?? null,
    sourceType: row.source_type ?? "manual_input",
    sourceName: row.source_name ?? row.name ?? sourceLabel(row.source_type ?? "manual_input"),
    status: row.status ?? "prepared",
    accountId: row.account_id ?? null,
    accountName: row.account_name ?? null,
    currency: row.currency ?? null,
    timezone: row.timezone ?? null,
    lastSyncedAt: row.last_synced_at ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBatch(row: Record<string, any>): ImportBatch {
  return {
    id: row.id,
    organizationId: row.organization_id,
    sourceId: row.source_id ?? null,
    sourceType: row.source_type,
    status: row.status,
    startedAt: row.started_at ?? null,
    finishedAt: row.finished_at ?? null,
    recordsReceived: Number(row.records_received ?? 0),
    recordsImported: Number(row.records_imported ?? 0),
    recordsSkipped: Number(row.records_skipped ?? 0),
    warnings: row.warnings ?? [],
    errors: row.errors ?? [],
    checksum: row.checksum ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
  };
}

function mapQualityLog(row: Record<string, any>): DataQualityLog {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id ?? null,
    sourceId: row.source_id ?? null,
    severity: row.severity ?? "info",
    entityType: row.entity_type ?? null,
    entityId: row.entity_id ?? null,
    message: row.message,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function getDataSourcesOverview(): Promise<DataSourcesOverview> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return isSupabaseMode()
      ? { sources: [], batches: [], qualityLogs: [] }
      : { sources: mockSources, batches: mockBatches, qualityLogs: mockQualityLogs };
  }

  try {
    const [sourcesResult, batchesResult, qualityResult] = await Promise.all([
      supabase.from("data_sources").select("*, clients(name)").order("source_name", { ascending: true }),
      supabase.from("import_batches").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("data_quality_logs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    if (sourcesResult.error) throw sourcesResult.error;
    if (batchesResult.error) throw batchesResult.error;
    if (qualityResult.error) throw qualityResult.error;

    return {
      sources: (sourcesResult.data ?? []).map(mapSource),
      batches: (batchesResult.data ?? []).map(mapBatch),
      qualityLogs: (qualityResult.data ?? []).map(mapQualityLog),
    };
  } catch (error) {
    if (isSupabaseMode()) {
      console.warn("[supabase:data_sources] leitura indisponível; retornando estado vazio:", error);
      return { sources: [], batches: [], qualityLogs: [] };
    }
    console.warn("[supabase:data_sources] fallback para mock:", error);
    return { sources: mockSources, batches: mockBatches, qualityLogs: mockQualityLogs };
  }
}

export function getMockDataSourcesOverview(): DataSourcesOverview {
  return { sources: mockSources, batches: mockBatches, qualityLogs: mockQualityLogs };
}
