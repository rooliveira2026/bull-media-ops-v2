import type {
  Client,
  ClientAccess,
  DataSource,
  IntegrationConnection,
  Membership,
  Module,
  ModuleAccess,
  Organization,
  Permission,
  Role,
  User,
} from "../types/core";
import type {
  MediaClientOverview,
  MediaOverviewSummary,
  RecommendedAction,
} from "../types/media";

const now = "2026-06-09T19:00:00.000Z";

export const mockOrganizations: Organization[] = [
  {
    id: "org_bull",
    name: "Bull Digital",
    slug: "bull-digital",
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockClients: Client[] = [
  {
    id: "client_intercity",
    organizationId: "org_bull",
    clientId: "intercity_batel",
    name: "Intercity Batel",
    status: "active",
    primaryObjective: "Aumentar reservas diretas com eficiência de mídia.",
    businessModel: "Hotelaria",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "client_about",
    organizationId: "org_bull",
    clientId: "about_events",
    name: "About Events",
    status: "active",
    primaryObjective: "Gerar demanda qualificada para eventos corporativos.",
    businessModel: "Eventos",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "client_bull",
    organizationId: "org_bull",
    clientId: "bull_digital",
    name: "Bull Digital",
    status: "active",
    primaryObjective: "Acompanhar performance interna e novos produtos.",
    businessModel: "Marketing Operations",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockUsers: User[] = [
  {
    id: "user_rodrigo",
    email: "rodrigo@bulldigital.co",
    name: "Rodrigo Oliveira",
    avatarUrl: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
    roles: ["admin"],
  },
  {
    id: "user_media",
    email: "media@bulldigital.co",
    name: "Time de Mídia",
    avatarUrl: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
    roles: ["gestor", "analista"],
  },
];

export const mockMemberships: Membership[] = [
  {
    id: "membership_rodrigo",
    organizationId: "org_bull",
    profileId: "user_rodrigo",
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "membership_media",
    organizationId: "org_bull",
    profileId: "user_media",
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockRoles: Role[] = [
  { id: "role_admin", key: "admin", name: "Admin", description: "Acesso total à plataforma." },
  { id: "role_gestor", key: "gestor", name: "Gestor", description: "Gestão operacional e aprovações." },
  { id: "role_analista", key: "analista", name: "Analista", description: "Execução e análise operacional." },
  { id: "role_visualizador", key: "visualizador", name: "Visualizador", description: "Leitura de dados permitidos." },
];

export const mockClientAccess: ClientAccess[] = mockClients.map((client) => ({
  id: `access_${client.id}`,
  membershipId: "membership_media",
  clientId: client.id,
  accessLevel: "read",
  createdAt: now,
}));

export const mockModules: Module[] = [
  { id: "module_core", key: "core", name: "Core Platform", description: "Clientes, usuários, roles e permissões.", status: "active" },
  { id: "module_media_ops", key: "media_ops", name: "Media Ops", description: "Performance, diagnósticos e ações de mídia.", status: "active" },
  { id: "module_social_ops", key: "social_ops", name: "Social Ops", description: "Calendário, posts, aprovação e métricas sociais.", status: "active" },
  { id: "module_creative_ops", key: "creative_ops", name: "Creative Ops", description: "Criativos, testes e aprendizados.", status: "planned" },
  { id: "module_reports", key: "reports", name: "Reports", description: "Relatórios, revisão e histórico.", status: "planned" },
  { id: "module_pdm", key: "pdm", name: "PDM", description: "Planejamento mensal, cenários e aprovações.", status: "planned" },
  { id: "module_client_intelligence", key: "client_intelligence", name: "Client Intelligence", description: "Memória, briefings e insights.", status: "planned" },
  { id: "module_integrations", key: "integrations", name: "Integrations", description: "Conexões, pipelines e logs.", status: "planned" },
  { id: "module_ai_agents", key: "ai_agents", name: "AI Agents", description: "Agentes, execuções e artefatos.", status: "planned" },
];

export const mockModuleAccess: ModuleAccess[] = [
  { id: "module_access_admin_core", roleId: "role_admin", moduleKey: "core", actionKey: "manage", allowed: true },
  { id: "module_access_admin_media", roleId: "role_admin", moduleKey: "media_ops", actionKey: "manage", allowed: true },
  { id: "module_access_gestor_read", roleId: "role_gestor", moduleKey: "media_ops", actionKey: "read", allowed: true },
  { id: "module_access_gestor_approve", roleId: "role_gestor", moduleKey: "media_ops", actionKey: "approve_recommended_action", allowed: true },
  { id: "module_access_gestor_dismiss", roleId: "role_gestor", moduleKey: "media_ops", actionKey: "dismiss_recommended_action", allowed: true },
  { id: "module_access_gestor_media", roleId: "role_gestor", moduleKey: "media_ops", actionKey: "execute", allowed: true },
  { id: "module_access_analista_media", roleId: "role_analista", moduleKey: "media_ops", actionKey: "read", allowed: true },
  { id: "module_access_analista_review", roleId: "role_analista", moduleKey: "media_ops", actionKey: "move_action_to_review", allowed: true },
  { id: "module_access_analista_execute", roleId: "role_analista", moduleKey: "media_ops", actionKey: "execute_recommended_action", allowed: true },
  { id: "module_access_analista_monitor", roleId: "role_analista", moduleKey: "media_ops", actionKey: "register_action_result", allowed: true },
  { id: "module_access_viewer_media", roleId: "role_visualizador", moduleKey: "media_ops", actionKey: "read", allowed: true },
  { id: "module_access_gestor_social_read", roleId: "role_gestor", moduleKey: "social_ops", actionKey: "read", allowed: true },
  { id: "module_access_gestor_social_approve", roleId: "role_gestor", moduleKey: "social_ops", actionKey: "approve_social_post", allowed: true },
  { id: "module_access_gestor_social_adjust", roleId: "role_gestor", moduleKey: "social_ops", actionKey: "request_social_post_adjustments", allowed: true },
  { id: "module_access_gestor_social_status", roleId: "role_gestor", moduleKey: "social_ops", actionKey: "update_social_post_status", allowed: true },
  { id: "module_access_analista_social_read", roleId: "role_analista", moduleKey: "social_ops", actionKey: "read", allowed: true },
  { id: "module_access_analista_social_create", roleId: "role_analista", moduleKey: "social_ops", actionKey: "create", allowed: true },
  { id: "module_access_analista_social_edit", roleId: "role_analista", moduleKey: "social_ops", actionKey: "edit", allowed: true },
  { id: "module_access_analista_social_submit", roleId: "role_analista", moduleKey: "social_ops", actionKey: "submit_social_post", allowed: true },
  { id: "module_access_analista_social_status", roleId: "role_analista", moduleKey: "social_ops", actionKey: "update_social_post_status", allowed: true },
  { id: "module_access_viewer_social", roleId: "role_visualizador", moduleKey: "social_ops", actionKey: "read", allowed: true },
  { id: "module_access_viewer_reports", roleId: "role_visualizador", moduleKey: "reports", actionKey: "read", allowed: true },
];

export const mockDataSources: DataSource[] = [
  { id: "source_google_ads", key: "google_ads", name: "Google Ads", category: "paid_media", status: "planned" },
  { id: "source_ga4", key: "ga4", name: "Google Analytics 4", category: "analytics", status: "planned" },
  { id: "source_meta_ads", key: "meta_ads", name: "Meta Ads", category: "paid_media", status: "planned" },
  { id: "source_instagram", key: "instagram", name: "Instagram", category: "social", status: "planned" },
  { id: "source_facebook", key: "facebook", name: "Facebook", category: "social", status: "planned" },
  { id: "source_linkedin_ads", key: "linkedin_ads", name: "LinkedIn Ads", category: "paid_media", status: "planned" },
  { id: "source_tiktok", key: "tiktok", name: "TikTok", category: "social", status: "planned" },
  { id: "source_clickup", key: "clickup", name: "ClickUp", category: "operations", status: "planned" },
  { id: "source_google_sheets", key: "google_sheets", name: "Google Sheets", category: "temporary_import", status: "planned" },
];

export const mockIntegrationConnections: IntegrationConnection[] = mockDataSources.slice(0, 4).map((source) => ({
  id: `connection_${source.key}`,
  organizationId: "org_bull",
  clientId: null,
  dataSourceKey: source.key,
  externalAccountId: null,
  status: "not_connected",
  lastSyncAt: null,
  errorMessage: null,
  createdAt: now,
  updatedAt: now,
}));

export const mockPermissions: Permission[] = [
  { moduleKey: "core", actionKey: "manage" },
  { moduleKey: "media_ops", actionKey: "read" },
  { moduleKey: "media_ops", actionKey: "execute" },
  { moduleKey: "social_ops", actionKey: "read" },
  { moduleKey: "reports", actionKey: "read" },
  { moduleKey: "pdm", actionKey: "read" },
  { moduleKey: "integrations", actionKey: "manage" },
];

export const mockMediaSummary: MediaOverviewSummary = {
  clientsCount: 3,
  attentionCount: 1,
  criticalCount: 1,
  pendingActionsCount: 7,
  spend: 186420,
  conversions: 1432,
  revenue: 712900,
  cpa: 130.18,
  roas: 3.82,
  currency: "BRL",
};

export const mockMediaClients: MediaClientOverview[] = [
  {
    clientId: "client_intercity",
    clientName: "Intercity Batel",
    status: "opportunity",
    spend: 58300,
    conversions: 512,
    revenue: 244800,
    cpa: 113.87,
    roas: 4.2,
    topAlert: "Volume estável, com oportunidade de ampliar reserva direta.",
    topOpportunity: "Escalar campanhas de maior ROAS com controle de CPA.",
  },
  {
    clientId: "client_about",
    clientName: "About Events",
    status: "attention",
    spend: 79200,
    conversions: 438,
    revenue: 267400,
    cpa: 180.82,
    roas: 3.38,
    topAlert: "CPA acima da meta em campanhas de captação.",
    topOpportunity: "Refinar termos e audiências com maior intenção comercial.",
  },
  {
    clientId: "client_bull",
    clientName: "Bull Digital",
    status: "critical",
    spend: 48920,
    conversions: 482,
    revenue: 200700,
    cpa: 101.49,
    roas: 4.1,
    topAlert: "Baixa consistência entre canais em campanhas recentes.",
    topOpportunity: "Concentrar investimento em canais com melhor qualidade pós-clique.",
  },
];

export const mockRecommendedActions: RecommendedAction[] = [
  {
    id: "action_001",
    clientId: "client_about",
    clientName: "About Events",
    title: "Refinar termos de busca com baixa intenção",
    description: "Concentrar investimento nas pesquisas com maior sinal comercial e reduzir dispersão.",
    priority: "alta",
    impact: "alto",
    risk: "medio",
    status: "pending",
    dueDate: "2026-06-14",
  },
  {
    id: "action_002",
    clientId: "client_intercity",
    clientName: "Intercity Batel",
    title: "Escalar campanhas com ROAS acima da meta",
    description: "Aumentar orçamento gradualmente nas campanhas com conversão consistente.",
    priority: "media",
    impact: "alto",
    risk: "baixo",
    status: "pending",
    dueDate: "2026-06-18",
  },
  {
    id: "action_003",
    clientId: "client_bull",
    clientName: "Bull Digital",
    title: "Revisar correlação mídia e qualidade pós-clique",
    description: "Cruzar campanhas com indicadores de GA4 antes de ampliar investimento.",
    priority: "alta",
    impact: "medio",
    risk: "medio",
    status: "recheck",
    dueDate: "2026-06-16",
  },
];
