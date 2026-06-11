export type SourceType =
  | "legacy_v1_export"
  | "google_ads_api"
  | "meta_ads_api"
  | "ga4_api"
  | "linkedin_ads_api"
  | "clickup_api"
  | "manual_input";

export type DataSourceStatus =
  | "not_connected"
  | "prepared"
  | "pending_credentials"
  | "connected"
  | "validating"
  | "error";

export type ImportBatchStatus =
  | "pending"
  | "running"
  | "completed"
  | "completed_with_warnings"
  | "failed";

export type DataQualitySeverity = "info" | "warning" | "attention";

export interface OperationalDataSource {
  id: string;
  organizationId: string | null;
  clientId: string | null;
  clientName: string | null;
  sourceType: SourceType;
  sourceName: string;
  status: DataSourceStatus;
  accountId: string | null;
  accountName: string | null;
  currency: string | null;
  timezone: string | null;
  lastSyncedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ImportBatch {
  id: string;
  organizationId: string;
  sourceId: string | null;
  sourceType: SourceType;
  status: ImportBatchStatus;
  startedAt: string | null;
  finishedAt: string | null;
  recordsReceived: number;
  recordsImported: number;
  recordsSkipped: number;
  warnings: string[];
  errors: string[];
  checksum: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface DataQualityLog {
  id: string;
  organizationId: string;
  clientId: string | null;
  sourceId: string | null;
  severity: DataQualitySeverity;
  entityType: string | null;
  entityId: string | null;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DataSourcesOverview {
  sources: OperationalDataSource[];
  batches: ImportBatch[];
  qualityLogs: DataQualityLog[];
}
