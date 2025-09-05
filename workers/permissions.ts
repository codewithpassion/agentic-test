import type { UserResource } from "@clerk/types";
import type { Permission, UserRole } from "./types";
import { ROLE_PERMISSIONS } from "./types";

// Permission helpers for Clerk users
// In production, these would check Clerk's publicMetadata

export function canAssignRole(
	currentUser: UserResource | null,
	targetRole: string,
): boolean {
	// Only superadmins can assign roles
	const roles = (currentUser?.publicMetadata?.roles as UserRole[]) || ["user"];
	return roles.includes("superadmin");
}

export function canModifyUser(
	currentUser: UserResource | null,
	targetUser: UserResource | null,
): boolean {
	// Superadmins can modify anyone
	const roles = (currentUser?.publicMetadata?.roles as UserRole[]) || ["user"];
	return roles.includes("superadmin");
}

export function hasRole(user: UserResource | null, role: string): boolean {
	const roles = (user?.publicMetadata?.roles as UserRole[]) || ["user"];
	return roles.includes(role as UserRole);
}

export function hasPermission(
	user: UserResource | null,
	permission: Permission,
): boolean {
	const userRoles = (user?.publicMetadata?.roles as UserRole[]) || ["user"];

	// Check if any of the user's roles have the required permission
	return userRoles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
}

export function isAdmin(user: UserResource | null): boolean {
	return hasRole(user, "admin") || hasRole(user, "superadmin");
}

export function isSuperAdmin(user: UserResource | null): boolean {
	return hasRole(user, "superadmin");
}
