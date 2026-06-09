export type ModuleKey =
  | "core"
  | "media_ops"
  | "social_ops"
  | "creative_ops"
  | "reports"
  | "pdm"
  | "client_intelligence"
  | "ai_agents"
  | "integrations";

export type AppRole = "admin" | "gestor" | "analista" | "visualizador";

export type RecordStatus = "active" | "inactive" | "archived";

export type AccessLevel = "read" | "edit" | "manage";

export type ModuleAction =
  | "read"
  | "create"
  | "edit"
  | "approve"
  | "execute"
  | "execute_recommended_action"
  | "approve_recommended_action"
  | "dismiss_recommended_action"
  | "move_action_to_review"
  | "mark_action_monitoring"
  | "register_action_result"
  | "reopen_recommended_action"
  | "submit_social_post"
  | "approve_social_post"
  | "request_social_post_adjustments"
  | "update_social_post_status"
  | "manage";

export type IntegrationStatus = "not_connected" | "connected" | "syncing" | "error";

export type DataSourceCategory =
  | "paid_media"
  | "analytics"
  | "social"
  | "operations"
  | "temporary_import";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  organizationId: string;
  clientId: string;
  name: string;
  status: RecordStatus;
  primaryObjective: string;
  businessModel: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  organizationId: string;
  profileId: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  key: AppRole;
  name: string;
  description: string;
}

export interface User extends Profile {
  status: RecordStatus;
  roles: AppRole[];
}

export interface Permission {
  moduleKey: ModuleKey;
  actionKey: ModuleAction;
}

export interface ClientAccess {
  id: string;
  membershipId: string;
  clientId: string;
  accessLevel: AccessLevel;
  createdAt: string;
}

export interface Module {
  id: string;
  key: ModuleKey;
  name: string;
  description: string;
  status: "active" | "planned" | "inactive";
}

export interface ModuleAccess {
  id: string;
  roleId: string;
  moduleKey: ModuleKey;
  actionKey: ModuleAction;
  allowed: boolean;
}

export interface DataSource {
  id: string;
  key:
    | "google_ads"
    | "ga4"
    | "meta_ads"
    | "instagram"
    | "facebook"
    | "linkedin_ads"
    | "tiktok"
    | "clickup"
    | "google_sheets";
  name: string;
  category: DataSourceCategory;
  status: "planned" | "active" | "inactive";
}

export interface IntegrationConnection {
  id: string;
  organizationId: string;
  clientId: string | null;
  dataSourceKey: DataSource["key"];
  externalAccountId: string | null;
  status: IntegrationStatus;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  clientId: string | null;
  profileId: string | null;
  moduleKey: ModuleKey;
  actionKey: ModuleAction;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
