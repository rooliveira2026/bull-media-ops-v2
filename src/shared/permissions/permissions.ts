import type {
  AppRole,
  ClientAccess,
  ModuleAccess,
  ModuleAction,
  ModuleKey,
  Role,
  User,
} from "../types/core";

export function isAdmin(user: Pick<User, "roles"> | null): boolean {
  return Boolean(user?.roles.includes("admin"));
}

export function hasRole(user: Pick<User, "roles"> | null, role: AppRole | AppRole[]): boolean {
  if (!user) return false;
  const roles = Array.isArray(role) ? role : [role];
  return roles.some((item) => user.roles.includes(item));
}

export function canAccessClient(
  user: Pick<User, "roles"> | null,
  membershipId: string | null,
  clientId: string,
  accessList: ClientAccess[],
): boolean {
  if (isAdmin(user)) return true;
  if (!membershipId) return false;
  return accessList.some((access) => access.membershipId === membershipId && access.clientId === clientId);
}

export function canAccessModule(
  user: Pick<User, "roles"> | null,
  moduleKey: ModuleKey,
  roles: Role[],
  moduleAccess: ModuleAccess[],
): boolean {
  return canPerformModuleAction(user, moduleKey, "read", roles, moduleAccess);
}

export function canPerformModuleAction(
  user: Pick<User, "roles"> | null,
  moduleKey: ModuleKey,
  actionKey: ModuleAction,
  roles: Role[],
  moduleAccess: ModuleAccess[],
): boolean {
  if (isAdmin(user)) return true;
  if (!user) return false;

  const roleIds = roles
    .filter((role) => user.roles.includes(role.key))
    .map((role) => role.id);

  return moduleAccess.some((access) => {
    const actionMatches =
      access.actionKey === actionKey ||
      access.actionKey === "manage" ||
      (actionKey !== "read" && access.actionKey === "edit");

    return access.allowed && access.moduleKey === moduleKey && actionMatches && roleIds.includes(access.roleId);
  });
}
