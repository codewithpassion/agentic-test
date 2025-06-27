/// <reference path="../worker-configuration.d.ts" />
import type { AuthCloudflareBindings } from "@portcityai/better-auth";
import type { authSchema } from "@portcityai/better-auth";
import type { DrizzleD1Database } from "drizzle-orm/d1";

declare global {
	interface CloudflareEnvironment extends CloudflareBindings {}
	interface CloudflareVariables extends DatabaseVariables {
		loginService: AuthCloudflareBindings;
	}
}

export type DatabaseVariables = {
	Database: Database;
};
export type DatabaseClient = DrizzleD1Database<Record<string, never>>;

export type Database = {
	client: DatabaseClient;
	seed: () => Promise<void>;
};

export type AppType = {
	Bindings: CloudflareEnvironment;
	Variables: CloudflareVariables;
};

export type User = typeof authSchema.user.$inferSelect;
export type Session = typeof authSchema.session.$inferSelect;

export type UserRole = "user" | "admin" | "superadmin";

export interface AuthUser extends User {}

export interface AuthSession extends Session {
	user: AuthUser;
}

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
