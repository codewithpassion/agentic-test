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
	if (!user || !user.roles) return false;

	// Check if any of the user's roles have the required permission.
	return user.roles.some((role) => {
		const userPermissions = ROLE_PERMISSIONS[role] || [];
		return userPermissions.includes(permission);
	});
}

/**
 * Check if a user has a specific role or higher
 */
export function hasRole(
	user: AuthUser | null,
	requiredRole: UserRole,
): boolean {
	if (!user || !user.roles || user.roles.length === 0) {
		return false;
	}

	// Find the highest role level the user has
	const userLevel = Math.max(
		...user.roles.map((role) => ROLE_HIERARCHY[role] || 0),
	);
	const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

	return userLevel >= requiredLevel;
}

/**
 * Check if a user is an admin (admin or superadmin)
 */
export function isAdmin(user: AuthUser | null): boolean {
	return hasRole(user, "admin") || hasRole(user, "superadmin");
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
	if (!user || !user.roles) return [];

	// Collect all unique permissions from all of the user's roles.
	const allPermissions = user.roles.flatMap(
		(role) => ROLE_PERMISSIONS[role] || [],
	);
	return [...new Set(allPermissions)]; // Return unique permissions
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
	return !target.roles.includes("superadmin");
}
