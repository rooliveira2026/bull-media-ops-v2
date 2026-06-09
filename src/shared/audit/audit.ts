import { createAuditLog } from "../../modules/core/api/core-repository";
import type { AuditLog, ModuleAction, ModuleKey } from "../types/core";

interface AuditEventInput {
  organizationId: string;
  clientId?: string | null;
  profileId?: string | null;
  moduleKey: ModuleKey;
  actionKey: ModuleAction;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export function createAuditEvent(input: AuditEventInput): Promise<AuditLog> {
  return createAuditLog({
    organizationId: input.organizationId,
    clientId: input.clientId ?? null,
    profileId: input.profileId ?? null,
    moduleKey: input.moduleKey,
    actionKey: input.actionKey,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}
