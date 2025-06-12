# Task 2: User Roles Extension

## Overview
Extend the existing better-auth system to support role-based access control with User, Admin, and SuperAdmin roles.

## Goals
- Extend better-auth user schema with roles
- Create role-checking utilities
- Implement role-based permissions
- Set up role assignment system

## Better-Auth Configuration Updates

### File: `packages/better-auth/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { magicLink } from "better-auth/plugins/magic-link";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "../../api/database/db";
import * as schema from "../../api/database/schema";

export const auth = betterAuth({
	database: drizzleAdapter(createDb, {
		provider: "sqlite",
		schema: {
			...schema,
		},
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
	},
	socialProviders: {
		// Add social providers as needed
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "user",
				validation: {
					enum: ["user", "admin", "superadmin"],
				},
			},
		},
	},
	plugins: [
		admin({
			impersonationSessionDuration: 60 * 60 * 2, // 2 hours
		}),
		magicLink({
			sendMagicLink: async ({ email, url, token }) => {
				// Email sending logic here
				console.log(`Magic link for ${email}: ${url}`);
			},
		}),
	],
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	advanced: {
		generateId: () => crypto.randomUUID(),
	},
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

### File: `packages/better-auth/types.ts`

```typescript
import type { auth } from "./auth";

export type User = typeof auth.$Infer.User;
export type Session = typeof auth.$Infer.Session;

export type UserRole = "user" | "admin" | "superadmin";

export interface AuthUser extends User {
	role: UserRole;
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

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

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
		...ROLE_PERMISSIONS.user,
		// Plus admin permissions
		PERMISSIONS.MODERATE_CONTENT,
		PERMISSIONS.MANAGE_COMPETITIONS,
		PERMISSIONS.MANAGE_CATEGORIES,
		PERMISSIONS.VIEW_REPORTS,
		PERMISSIONS.SELECT_WINNERS,
	],
	superadmin: [
		// All admin permissions
		...ROLE_PERMISSIONS.admin,
		// Plus superadmin permissions
		PERMISSIONS.MANAGE_USERS,
		PERMISSIONS.ASSIGN_ROLES,
		PERMISSIONS.SYSTEM_CONFIG,
	],
};
```

### File: `packages/better-auth/permissions.ts`

```typescript
import { AuthUser, UserRole, Permission, ROLE_HIERARCHY, ROLE_PERMISSIONS } from "./types";

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
	if (!user) return false;
	
	const userPermissions = ROLE_PERMISSIONS[user.role] || [];
	return userPermissions.includes(permission);
}

/**
 * Check if a user has a specific role or higher
 */
export function hasRole(user: AuthUser | null, requiredRole: UserRole): boolean {
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
	resourceUserId?: string
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
 * Role assignment utilities (SuperAdmin only)
 */
export class RoleManager {
	/**
	 * Check if a user can assign a specific role
	 */
	static canAssignRole(assigner: AuthUser | null, targetRole: UserRole): boolean {
		if (!assigner) return false;
		
		// Only superadmins can assign roles
		if (!isSuperAdmin(assigner)) return false;
		
		// Superadmins can assign any role
		return true;
	}
	
	/**
	 * Check if a user can modify another user's role
	 */
	static canModifyUser(modifier: AuthUser | null, target: AuthUser): boolean {
		if (!modifier) return false;
		
		// Users cannot modify themselves
		if (modifier.id === target.id) return false;
		
		// Only superadmins can modify user roles
		if (!isSuperAdmin(modifier)) return false;
		
		// Superadmins can modify anyone except other superadmins
		// (prevents accidental lockout)
		return target.role !== "superadmin";
	}
}
```

### File: `packages/better-auth/hooks.ts`

```typescript
import { useSession } from "better-auth/react";
import { AuthUser, Permission, UserRole } from "./types";
import { hasPermission, hasRole, isAdmin, isSuperAdmin } from "./permissions";

/**
 * React hook for authentication with role information
 */
export function useAuthUser() {
	const { data: session, isPending, error } = useSession();
	
	return {
		user: session?.user as AuthUser | null,
		session,
		isPending,
		error,
		isAuthenticated: !!session?.user,
	};
}

/**
 * React hook for permission checking
 */
export function usePermissions() {
	const { user } = useAuthUser();
	
	return {
		hasPermission: (permission: Permission) => hasPermission(user, permission),
		hasRole: (role: UserRole) => hasRole(user, role),
		isAdmin: () => isAdmin(user),
		isSuperAdmin: () => isSuperAdmin(user),
		canPerformAction: (permission: Permission, resourceUserId?: string) =>
			canPerformAction(user, permission, resourceUserId),
	};
}

/**
 * React hook for role-based rendering
 */
export function useRoleGuard() {
	const { user } = useAuthUser();
	
	return {
		/**
		 * Render component only if user has required role
		 */
		requireRole: (role: UserRole, children: React.ReactNode) => {
			return hasRole(user, role) ? children : null;
		},
		
		/**
		 * Render component only if user has required permission
		 */
		requirePermission: (permission: Permission, children: React.ReactNode) => {
			return hasPermission(user, permission) ? children : null;
		},
		
		/**
		 * Render different content based on user role
		 */
		switchRole: (components: Partial<Record<UserRole, React.ReactNode>>) => {
			if (!user) return null;
			return components[user.role] || null;
		},
	};
}
```

## Server-Side Utilities

### File: `workers/auth-utils.ts`

```typescript
import { auth } from "~~packages/better-auth/auth";
import { AuthUser, Permission } from "~~packages/better-auth/types";
import { hasPermission, hasRole, isAdmin } from "~~packages/better-auth/permissions";

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		
		return session?.user as AuthUser || null;
	} catch (error) {
		console.error("Error getting auth user:", error);
		return null;
	}
}

/**
 * Require authentication for a request
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
	const user = await getAuthUser(request);
	if (!user) {
		throw new Error("Authentication required");
	}
	return user;
}

/**
 * Require specific permission for a request
 */
export async function requirePermission(
	request: Request,
	permission: Permission
): Promise<AuthUser> {
	const user = await requireAuth(request);
	
	if (!hasPermission(user, permission)) {
		throw new Error(`Permission required: ${permission}`);
	}
	
	return user;
}

/**
 * Require specific role for a request
 */
export async function requireRole(
	request: Request,
	role: UserRole
): Promise<AuthUser> {
	const user = await requireAuth(request);
	
	if (!hasRole(user, role)) {
		throw new Error(`Role required: ${role}`);
	}
	
	return user;
}

/**
 * Require admin access for a request
 */
export async function requireAdmin(request: Request): Promise<AuthUser> {
	const user = await requireAuth(request);
	
	if (!isAdmin(user)) {
		throw new Error("Admin access required");
	}
	
	return user;
}

/**
 * Check if user owns a resource or is admin
 */
export async function requireOwnershipOrAdmin(
	request: Request,
	resourceUserId: string
): Promise<AuthUser> {
	const user = await requireAuth(request);
	
	if (user.id !== resourceUserId && !isAdmin(user)) {
		throw new Error("Access denied: insufficient permissions");
	}
	
	return user;
}
```

## Database Utilities for Roles

### File: `api/database/user-utils.ts`

```typescript
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";
import { UserRole } from "~~packages/better-auth/types";

/**
 * Update user role (SuperAdmin only)
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
	return await db
		.update(users)
		.set({ 
			role: newRole,
			updatedAt: new Date()
		})
		.where(eq(users.id, userId))
		.returning();
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: UserRole) {
	return await db
		.select()
		.from(users)
		.where(eq(users.role, role));
}

/**
 * Get all admins and superadmins
 */
export async function getAdminUsers() {
	return await db
		.select()
		.from(users)
		.where(
			sql`${users.role} IN ('admin', 'superadmin')`
		);
}

/**
 * Count users by role
 */
export async function countUsersByRole() {
	return await db
		.select({
			role: users.role,
			count: sql<number>`cast(count(*) as int)`,
		})
		.from(users)
		.groupBy(users.role);
}

/**
 * Promote user to admin
 */
export async function promoteToAdmin(userId: string) {
	return await updateUserRole(userId, "admin");
}

/**
 * Demote admin to user
 */
export async function demoteToUser(userId: string) {
	return await updateUserRole(userId, "user");
}
```

## Role Migration Utility

### File: `scripts/migrate-user-roles.ts`

```typescript
import { db } from "../api/database/db";
import { users } from "../api/database/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Migrate existing users to have default "user" role
 */
export async function migrateUserRoles() {
	console.log("Starting user role migration...");
	
	try {
		// Update users with null roles to "user"
		const result = await db
			.update(users)
			.set({ role: "user" })
			.where(isNull(users.role));
		
		console.log(`Migrated ${result.changes} users to default role`);
		
		// Optionally promote specific users to admin
		// await promoteInitialAdmins();
		
		console.log("User role migration completed successfully");
	} catch (error) {
		console.error("Error during user role migration:", error);
		throw error;
	}
}

/**
 * Promote initial admin users
 */
async function promoteInitialAdmins() {
	const adminEmails = [
		"admin@wildlifedisease.org",
		// Add more admin emails here
	];
	
	for (const email of adminEmails) {
		try {
			const result = await db
				.update(users)
				.set({ role: "admin" })
				.where(eq(users.email, email));
			
			if (result.changes > 0) {
				console.log(`Promoted ${email} to admin`);
			} else {
				console.log(`User ${email} not found`);
			}
		} catch (error) {
			console.error(`Error promoting ${email}:`, error);
		}
	}
}

// Run migration if called directly
if (import.meta.main) {
	await migrateUserRoles();
}
```

## Success Criteria
- [ ] Better-auth extended with role field
- [ ] Role-based permission system implemented
- [ ] Permission checking utilities created
- [ ] React hooks for role-based rendering
- [ ] Server-side authentication utilities
- [ ] Database utilities for role management
- [ ] Migration script for existing users
- [ ] Type safety maintained throughout

## Dependencies
- Task 1: Database Schema (for user table updates)
- Existing better-auth setup
- React hooks for client-side usage

## Estimated Time
**1 day**

## Next Task
Task 3: tRPC Router Setup - Create type-safe API procedures with role-based protection