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

export async function listOrganizations(): Promise<Organization[]> {
  return mockOrganizations;
}

export async function listClients(): Promise<Client[]> {
  return mockClients;
}

export async function getClientById(id: string): Promise<Client | null> {
  return mockClients.find((client) => client.id === id || client.clientId === id) ?? null;
}

export async function listProfiles(): Promise<User[]> {
  return mockUsers;
}

export async function listRoles(): Promise<Role[]> {
  return mockRoles;
}

export async function listModules(): Promise<Module[]> {
  return mockModules;
}

export async function listClientAccess(): Promise<ClientAccess[]> {
  return mockClientAccess;
}

export async function listDataSources(): Promise<DataSource[]> {
  return mockDataSources;
}

export async function listIntegrationConnections(): Promise<IntegrationConnection[]> {
  return mockIntegrationConnections;
}

export async function createAuditLog(event: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
  const auditLog: AuditLog = {
    id: `audit_${auditEvents.length + 1}`,
    createdAt: new Date().toISOString(),
    ...event,
  };
  auditEvents.unshift(auditLog);
  return auditLog;
}

export async function listAuditLogs(filters: { entityType?: string; entityId?: string } = {}): Promise<AuditLog[]> {
  return auditEvents.filter((event) => {
    const entityTypeMatches = !filters.entityType || event.entityType === filters.entityType;
    const entityIdMatches = !filters.entityId || event.entityId === filters.entityId;
    return entityTypeMatches && entityIdMatches;
  });
}
