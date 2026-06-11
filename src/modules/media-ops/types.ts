export type MediaPeriod = "last_7d" | "last_30d" | "current_month";
export type RecommendedActionStatus =
  | "suggested"
  | "in_review"
  | "approved"
  | "executed"
  | "monitoring"
  | "dismissed";
export type RecommendedActionPriority = "high" | "medium" | "low";

export interface MediaCampaign {
  id: string;
  organizationId: string;
  clientId: string;
  externalCampaignId: string | null;
  sourcePlatform: string;
  channel: string;
  campaignName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaMetricDaily {
  id: string;
  organizationId: string;
  clientId: string;
  campaignId: string | null;
  date: string;
  periodKey: MediaPeriod | string;
  sourcePlatform: string;
  channel: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  revenue: number;
  cpc: number;
  cpa: number;
  ctr: number;
  roas: number;
  rawSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaImportRun {
  id: string;
  organizationId: string;
  source: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  finishedAt: string | null;
  rowsImported: number;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
}

export interface RecommendedAction {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  moduleKey: "media_ops";
  sourcePlatform: string;
  channel: string;
  campaignName: string | null;
  title: string;
  description: string;
  priority: RecommendedActionPriority;
  status: RecommendedActionStatus;
  curationNote: string | null;
  dismissedReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  executedBy: string | null;
  executedAt: string | null;
  recheckAt: string | null;
  expectedImpact: string;
  impactAssessment: string | null;
  confidence: number | null;
  metricImpacted: string | null;
  beforeValue: number | null;
  afterValue: number | null;
  actionGroupId?: string | null;
  parentActionId?: string | null;
  affectedItemsCount?: number;
  groupedOccurrences?: string[];
  effortLevel?: "baixo" | "médio" | "alto";
  decisionOwner?: string | null;
  recommendationType?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ActionExecution {
  id: string;
  organizationId: string;
  actionId: string;
  clientId: string;
  profileId: string | null;
  executedBy: string | null;
  status: string;
  executionNote: string | null;
  executedAt: string;
  recheckAt: string | null;
  impactAssessment: string | null;
  metadata: Record<string, unknown>;
}

export interface MediaKpi {
  key: string;
  label: string;
  value: number;
  unit: "currency" | "number" | "ratio";
}

export interface ChannelSummary {
  channel: string;
  cost: number;
  conversions: number;
  revenue: number;
  cpa: number;
  roas: number;
}

export interface ClientMediaSummary {
  clientId: string;
  clientName: string;
  status: "healthy" | "strategic_attention" | "review" | "evolution_opportunity";
  cost: number;
  conversions: number;
  revenue: number;
  cpa: number;
  roas: number;
  activeChannels: number;
  recommendedActions: number;
  mainReading: string;
}

export interface MediaOverview {
  period: MediaPeriod;
  updatedAt: string;
  summary: {
    monitoredClients: number;
    activeChannels: number;
    accountsForReview: number;
    recommendedActions: number;
    cost: number;
    conversions: number;
    revenue: number;
    cpa: number;
    roas: number;
  };
  topChannels: ChannelSummary[];
  clients: ClientMediaSummary[];
  actions: RecommendedAction[];
}

export interface ExecuteRecommendedActionPayload {
  profileId?: string | null;
  executedBy?: string | null;
  executionNote?: string;
  recheckAt?: string | null;
}

export interface ApproveRecommendedActionPayload {
  profileId?: string | null;
  curationNote?: string;
}

export interface MoveActionToReviewPayload {
  profileId?: string | null;
  note?: string;
}

export interface MarkActionMonitoringPayload {
  profileId?: string | null;
  impactAssessment?: string;
  afterValue?: number | null;
  recheckAt?: string | null;
}
