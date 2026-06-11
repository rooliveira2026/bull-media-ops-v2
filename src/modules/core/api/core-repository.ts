import {
  mockClientAccess,
  mockClients,
  mockDataSources,
  mockIntegrationConnections,
  mockModules,
  mockOrganizations,
  mockRoles,
  mockUsers,
} from "../../../shared/api/mock-data";
import { getSupabaseClient } from "../../../shared/api/supabase-client";
import { isSupabaseMode } from "../../../shared/config/env";
import type {
  AuditLog,
  Client,
  ClientAccess,
  DataSource,
  IntegrationConnection,
  Module,
  Organization,
  Role,
  User,
} from "../../../shared/types/core";

const auditEvents: AuditLog[] = [];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface CoreRepository {
  listOrganizations(): Promise<Organization[]>;
  listClients(): Promise<Client[]>;
  getClientById(id: string): Promise<Client | null>;
  listProfiles(): Promise<User[]>;
  listRoles(): Promise<Role[]>;
  listModules(): Promise<Module[]>;
  listClientAccess(): Promise<ClientAccess[]>;
  listDataSources(): Promise<DataSource[]>;
  listIntegrationConnections(): Promise<IntegrationConnection[]>;
  createAuditLog(event: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;
  listAuditLogs(filters?: { entityType?: string; entityId?: string }): Promise<AuditLog[]>;
}

const mockRepository: CoreRepository = {
  async listOrganizations() {
    return mockOrganizations;
  },
  async listClients() {
    return mockClients;
  },
  async getClientById(id: string) {
    return mockClients.find((client) => client.id === id || client.clientId === id) ?? null;
  },
  async listProfiles() {
    return mockUsers;
  },
  async listRoles() {
    return mockRoles;
  },
  async listModules() {
    return mockModules;
  },
  async listClientAccess() {
    return mockClientAccess;
  },
  async listDataSources() {
    return mockDataSources;
  },
  async listIntegrationConnections() {
    return mockIntegrationConnections;
  },
  async createAuditLog(event) {
    const auditLog: AuditLog = {
      id: `audit_${auditEvents.length + 1}`,
      createdAt: new Date().toISOString(),
      ...event,
    };
    auditEvents.unshift(auditLog);
    return auditLog;
  },
  async listAuditLogs(filters = {}) {
    return auditEvents.filter((event) => {
      const entityTypeMatches = !filters.entityType || event.entityType === filters.entityType;
      const entityIdMatches = !filters.entityId || event.entityId === filters.entityId;
      return entityTypeMatches && entityIdMatches;
    });
  },
};

const emptyRepository: CoreRepository = {
  async listOrganizations() {
    return [];
  },
  async listClients() {
    return [];
  },
  async getClientById() {
    return null;
  },
  async listProfiles() {
    return [];
  },
  async listRoles() {
    return [];
  },
  async listModules() {
    return [];
  },
  async listClientAccess() {
    return [];
  },
  async listDataSources() {
    return [];
  },
  async listIntegrationConnections() {
    return [];
  },
  async createAuditLog() {
    throw new Error("Supabase indisponível para registrar auditoria.");
  },
  async listAuditLogs() {
    return [];
  },
};

function mapOrganization(row: Record<string, any>): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
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

function mapUser(row: Record<string, any>): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? row.email,
    avatarUrl: row.avatar_url ?? null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    roles: [],
  };
}

function mapRole(row: Record<string, any>): Role {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description ?? "",
  };
}

function mapModule(row: Record<string, any>): Module {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description ?? "",
    status: row.status,
  };
}

function mapClientAccess(row: Record<string, any>): ClientAccess {
  return {
    id: row.id,
    membershipId: row.membership_id,
    clientId: row.client_id,
    accessLevel: row.access_level,
    createdAt: row.created_at,
  };
}

function mapDataSource(row: Record<string, any>): DataSource {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    category: row.category,
    status: row.status,
  };
}

function mapIntegrationConnection(row: Record<string, any>): IntegrationConnection {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id ?? null,
    dataSourceKey: row.data_source_key,
    externalAccountId: row.external_account_id ?? null,
    status: row.status,
    lastSyncAt: row.last_sync_at ?? null,
    errorMessage: row.error_message ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditLog(row: Record<string, any>): AuditLog {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id ?? null,
    profileId: row.profile_id ?? null,
    moduleKey: row.module_key,
    actionKey: row.action_key,
    entityType: row.entity_type ?? null,
    entityId: row.entity_id ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

async function queryWithFallback<T>(callback: () => Promise<T>, fallback: () => Promise<T>) {
  const supabase = getSupabaseClient();
  if (!supabase) return isSupabaseMode() ? fallback() : fallback();
  try {
    return await callback();
  } catch (error) {
    if (isSupabaseMode()) {
      console.warn("[supabase] leitura indisponível; retornando estado vazio:", error);
      return fallback();
    }
    console.warn("[supabase] fallback para mock:", error);
    return fallback();
  }
}

function assertNoError(error: unknown) {
  if (error) throw error;
}

const supabaseRepository: CoreRepository = {
  async listOrganizations() {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.listOrganizations();
    const { data, error } = await supabase.from("organizations").select("*").order("name");
    assertNoError(error);
    return (data ?? []).map(mapOrganization);
  },
  async listClients() {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.listClients();
    const { data, error } = await supabase.from("clients").select("*").order("name");
    assertNoError(error);
    return (data ?? []).map(mapClient);
  },
  async getClientById(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.getClientById(id);
    const query = supabase.from("clients").select("*");
    const { data, error } = uuidPattern.test(id)
      ? await query.eq("id", id).maybeSingle()
      : await query.eq("client_id", id).maybeSingle();
    assertNoError(error);
    return data ? mapClient(data) : null;
  },
  async listProfiles() {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.listProfiles();
    const { data, error } = await supabase.from("profiles").select("*").order("name");
    assertNoError(error);
    return (data ?? []).map(mapUser);
  },
  async listRoles() {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.listRoles();
    const { data, error } = await supabase.from("roles").select("*").order("name");
    assertNoError(error);
    return (data ?? []).map(mapRole);
  },
  async listModules() {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.listModules();
    const { data, error } = await supabase.from("modules").select("*").order("name");
    assertNoError(error);
    return (data ?? []).map(mapModule);
  },
  async listClientAccess() {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.listClientAccess();
    const { data, error } = await supabase.from("client_access").select("*").order("created_at");
    assertNoError(error);
    return (data ?? []).map(mapClientAccess);
  },
  async listDataSources() {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.listDataSources();
    const { data, error } = await supabase.from("data_sources").select("*").order("name");
    assertNoError(error);
    return (data ?? []).map(mapDataSource);
  },
  async listIntegrationConnections() {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.listIntegrationConnections();
    const { data, error } = await supabase.from("integration_connections").select("*").order("created_at");
    assertNoError(error);
    return (data ?? []).map(mapIntegrationConnection);
  },
  async createAuditLog(event) {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.createAuditLog(event);
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        organization_id: event.organizationId,
        client_id: event.clientId,
        profile_id: event.profileId,
        module_key: event.moduleKey,
        action_key: event.actionKey,
        entity_type: event.entityType,
        entity_id: event.entityId,
        metadata: event.metadata,
      })
      .select("*")
      .single();
    assertNoError(error);
    return mapAuditLog(data);
  },
  async listAuditLogs(filters = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) return mockRepository.listAuditLogs(filters);
    let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false });
    if (filters.entityType) query = query.eq("entity_type", filters.entityType);
    if (filters.entityId) query = query.eq("entity_id", filters.entityId);
    const { data, error } = await query;
    assertNoError(error);
    return (data ?? []).map(mapAuditLog);
  },
};

export async function listOrganizations(): Promise<Organization[]> {
  return queryWithFallback(() => supabaseRepository.listOrganizations(), () => isSupabaseMode() ? emptyRepository.listOrganizations() : mockRepository.listOrganizations());
}

export async function listClients(): Promise<Client[]> {
  return queryWithFallback(() => supabaseRepository.listClients(), () => isSupabaseMode() ? emptyRepository.listClients() : mockRepository.listClients());
}

export async function getClientById(id: string): Promise<Client | null> {
  return queryWithFallback(() => supabaseRepository.getClientById(id), () => isSupabaseMode() ? emptyRepository.getClientById(id) : mockRepository.getClientById(id));
}

export async function listProfiles(): Promise<User[]> {
  return queryWithFallback(() => supabaseRepository.listProfiles(), () => isSupabaseMode() ? emptyRepository.listProfiles() : mockRepository.listProfiles());
}

export async function listRoles(): Promise<Role[]> {
  return queryWithFallback(() => supabaseRepository.listRoles(), () => isSupabaseMode() ? emptyRepository.listRoles() : mockRepository.listRoles());
}

export async function listModules(): Promise<Module[]> {
  return queryWithFallback(() => supabaseRepository.listModules(), () => isSupabaseMode() ? emptyRepository.listModules() : mockRepository.listModules());
}

export async function listClientAccess(): Promise<ClientAccess[]> {
  return queryWithFallback(() => supabaseRepository.listClientAccess(), () => isSupabaseMode() ? emptyRepository.listClientAccess() : mockRepository.listClientAccess());
}

export async function listDataSources(): Promise<DataSource[]> {
  return queryWithFallback(() => supabaseRepository.listDataSources(), () => isSupabaseMode() ? emptyRepository.listDataSources() : mockRepository.listDataSources());
}

export async function listIntegrationConnections(): Promise<IntegrationConnection[]> {
  return queryWithFallback(
    () => supabaseRepository.listIntegrationConnections(),
    () => isSupabaseMode() ? emptyRepository.listIntegrationConnections() : mockRepository.listIntegrationConnections(),
  );
}

export async function createAuditLog(event: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
  return queryWithFallback(() => supabaseRepository.createAuditLog(event), () => isSupabaseMode() ? emptyRepository.createAuditLog(event) : mockRepository.createAuditLog(event));
}

export async function listAuditLogs(filters: { entityType?: string; entityId?: string } = {}): Promise<AuditLog[]> {
  return queryWithFallback(() => supabaseRepository.listAuditLogs(filters), () => isSupabaseMode() ? emptyRepository.listAuditLogs(filters) : mockRepository.listAuditLogs(filters));
}
