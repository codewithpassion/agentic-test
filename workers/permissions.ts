import {
	type AuthUser,
	type Permission,
	ROLE_HIERARCHY,
	ROLE_PERMISSIONS,
	type UserRole,
} from "./types";

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
	user: AuthUser | null,
	permission: Permission,
): boolean {
	if (!user) return false;

	const userPermissions = ROLE_PERMISSIONS[user.role] || [];
	return userPermissions.includes(permission);
}

/**
 * Check if a user has a specific role or higher
 */
export function hasRole(
	user: AuthUser | null,
	requiredRole: UserRole,
): boolean {
	if (!user) return false;

	const userLevel = ROLE_HIERARCHY[user.role] || 0;
	const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

	return userLevel >= requiredLevel;
}

/**
 * Check if a user is an admin (admin or superadmin)
 */
export function isAdmin(user: AuthUser | null): boolean {
	return hasRole(user, "admin");
}

/**
 * Check if a user is a superadmin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
	return hasRole(user, "superadmin");
}

/**
 * Check if a user can perform an action on a resource
 */
export function canPerformAction(
	user: AuthUser | null,
	permission: Permission,
	resourceUserId?: string,
): boolean {
	if (!user) return false;

	// Check if user has the required permission
	if (!hasPermission(user, permission)) return false;

	// If checking ownership, verify the user owns the resource
	if (resourceUserId && resourceUserId !== user.id) {
		// Only allow if user is admin or higher
		return isAdmin(user);
	}

	return true;
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: AuthUser | null): Permission[] {
	if (!user) return [];
	return ROLE_PERMISSIONS[user.role] || [];
}

/**
 * Check if a user can assign a specific role (SuperAdmin only)
 */
export function canAssignRole(
	assigner: AuthUser | null,
	targetRole: UserRole,
): boolean {
	if (!assigner) return false;

	// Only superadmins can assign roles
	if (!isSuperAdmin(assigner)) return false;

	// Superadmins can assign any role
	return true;
}

/**
 * Check if a user can modify another user's role (SuperAdmin only)
 */
export function canModifyUser(
	modifier: AuthUser | null,
	target: AuthUser,
): boolean {
	if (!modifier) return false;

	// Users cannot modify themselves
	if (modifier.id === target.id) return false;

	// Only superadmins can modify user roles
	if (!isSuperAdmin(modifier)) return false;

	// Superadmins can modify anyone except other superadmins
	// (prevents accidental lockout)
	return target.role !== "superadmin";
}
