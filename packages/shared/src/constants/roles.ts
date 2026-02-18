// ============================================================================
// User Roles
// ============================================================================

export const USER_ROLES = ["admin", "developer", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Hierarchy level for each role (higher = more permissions) */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  developer: 2,
  user: 1,
};

/** Default role assigned to newly registered users */
export const DEFAULT_USER_ROLE: UserRole = "user";

/** Check if a role has at least the given minimum role level */
export function hasMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/** Check if a role is admin */
export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

/** Check if a role is at least developer (admin or developer) */
export function isDeveloperOrAbove(role: UserRole): boolean {
  return hasMinimumRole(role, "developer");
}
