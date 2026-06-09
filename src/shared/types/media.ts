export type HealthStatus = "healthy" | "attention" | "critical" | "opportunity";
export type ActionPriority = "alta" | "media" | "baixa";
export type ActionStatus = "pending" | "executed" | "recheck";

export interface MediaOverviewSummary {
  clientsCount: number;
  attentionCount: number;
  criticalCount: number;
  pendingActionsCount: number;
  spend: number;
  conversions: number;
  revenue: number;
  cpa: number;
  roas: number;
  currency: string;
}

export interface MediaClientOverview {
  clientId: string;
  clientName: string;
  status: HealthStatus;
  spend: number;
  conversions: number;
  revenue: number;
  cpa: number;
  roas: number;
  topAlert: string;
  topOpportunity: string;
}

export interface RecommendedAction {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  priority: ActionPriority;
  impact: "alto" | "medio" | "baixo";
  risk: "alto" | "medio" | "baixo";
  status: ActionStatus;
  dueDate: string;
}
