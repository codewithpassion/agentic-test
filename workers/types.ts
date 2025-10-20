/// <reference path="../worker-configuration.d.ts" />

declare global {
	interface CloudflareEnvironment extends CloudflareBindings {}
	interface CloudflareVariables {}
}

export type AppType = {
	Bindings: CloudflareEnvironment;
	Variables: CloudflareVariables;
};

export type UserRole = "user" | "admin" | "superadmin";

export type CloudflareBindings = globalThis.CloudflareBindings;

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
	user: 1,
	admin: 2,
	superadmin: 3,
} as const;

// Permission definitions
export const PERMISSIONS = {
	// Admin permissions
	VIEW_USERS: "view_users",

	// SuperAdmin permissions
	MANAGE_USERS: "manage_users",
	ASSIGN_ROLES: "assign_roles",
	SYSTEM_CONFIG: "system_config",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	user: [],
	admin: [
		// Admin permissions
		PERMISSIONS.VIEW_USERS,
	],
	superadmin: [
		// All admin permissions
		PERMISSIONS.VIEW_USERS,
		// Plus superadmin permissions
		PERMISSIONS.MANAGE_USERS,
		PERMISSIONS.ASSIGN_ROLES,
		PERMISSIONS.SYSTEM_CONFIG,
	],
};
