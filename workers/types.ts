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
	// User permissions
	CREATE_TODO: "create_todo",
	EDIT_TODO: "edit_todo",
	DELETE_TODO: "delete_todo",

	// Admin permissions
	MANAGE_TODOS: "manage_todos",
	VIEW_ALL_TODOS: "view_all_todos",

	// SuperAdmin permissions
	MANAGE_USERS: "manage_users",
	ASSIGN_ROLES: "assign_roles",
	SYSTEM_CONFIG: "system_config",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	user: [
		PERMISSIONS.CREATE_TODO,
		PERMISSIONS.EDIT_TODO,
		PERMISSIONS.DELETE_TODO,
	],
	admin: [
		// All user permissions
		PERMISSIONS.CREATE_TODO,
		PERMISSIONS.EDIT_TODO,
		PERMISSIONS.DELETE_TODO,
		// Plus admin permissions
		PERMISSIONS.MANAGE_TODOS,
		PERMISSIONS.VIEW_ALL_TODOS,
	],
	superadmin: [
		// All admin permissions
		PERMISSIONS.CREATE_TODO,
		PERMISSIONS.EDIT_TODO,
		PERMISSIONS.DELETE_TODO,
		PERMISSIONS.MANAGE_TODOS,
		PERMISSIONS.VIEW_ALL_TODOS,
		// Plus superadmin permissions
		PERMISSIONS.MANAGE_USERS,
		PERMISSIONS.ASSIGN_ROLES,
		PERMISSIONS.SYSTEM_CONFIG,
	],
};
