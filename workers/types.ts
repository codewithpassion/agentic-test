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

export interface AuthUser extends User {
	roles: UserRole[];
}

export interface AuthSession extends Session {
	user: AuthUser;
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
	user: 1,
	admin: 2,
	superadmin: 3,
} as const;

// Permission definitions
export const PERMISSIONS = {
	// User permissions
	SUBMIT_PHOTO: "submit_photo",
	VOTE_PHOTO: "vote_photo",
	REPORT_CONTENT: "report_content",
	EDIT_OWN_SUBMISSION: "edit_own_submission",

	// Admin permissions
	MODERATE_CONTENT: "moderate_content",
	MANAGE_COMPETITIONS: "manage_competitions",
	MANAGE_CATEGORIES: "manage_categories",
	VIEW_REPORTS: "view_reports",
	SELECT_WINNERS: "select_winners",

	// SuperAdmin permissions
	MANAGE_USERS: "manage_users",
	ASSIGN_ROLES: "assign_roles",
	SYSTEM_CONFIG: "system_config",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	user: [
		PERMISSIONS.SUBMIT_PHOTO,
		PERMISSIONS.VOTE_PHOTO,
		PERMISSIONS.REPORT_CONTENT,
		PERMISSIONS.EDIT_OWN_SUBMISSION,
	],
	admin: [
		// All user permissions
		PERMISSIONS.SUBMIT_PHOTO,
		PERMISSIONS.VOTE_PHOTO,
		PERMISSIONS.REPORT_CONTENT,
		PERMISSIONS.EDIT_OWN_SUBMISSION,
		// Plus admin permissions
		PERMISSIONS.MODERATE_CONTENT,
		PERMISSIONS.MANAGE_COMPETITIONS,
		PERMISSIONS.MANAGE_CATEGORIES,
		PERMISSIONS.VIEW_REPORTS,
		PERMISSIONS.SELECT_WINNERS,
	],
	superadmin: [
		// All admin permissions
		PERMISSIONS.SUBMIT_PHOTO,
		PERMISSIONS.VOTE_PHOTO,
		PERMISSIONS.REPORT_CONTENT,
		PERMISSIONS.EDIT_OWN_SUBMISSION,
		PERMISSIONS.MODERATE_CONTENT,
		PERMISSIONS.MANAGE_COMPETITIONS,
		PERMISSIONS.MANAGE_CATEGORIES,
		PERMISSIONS.VIEW_REPORTS,
		PERMISSIONS.SELECT_WINNERS,
		// Plus superadmin permissions
		PERMISSIONS.MANAGE_USERS,
		PERMISSIONS.ASSIGN_ROLES,
		PERMISSIONS.SYSTEM_CONFIG,
	],
};
