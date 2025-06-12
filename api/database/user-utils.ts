import { eq, sql } from "drizzle-orm";
import { user } from "../../packages/better-auth/db/auth-schema";
import type { UserRole } from "../../packages/better-auth/types";
import type { createDb, createDbWithSchema } from "./db";

// Type for database instance (can be with or without schema)
type DbInstance =
	| ReturnType<typeof createDb>
	| ReturnType<typeof createDbWithSchema>;

/**
 * Update user role (SuperAdmin only)
 */
export async function updateUserRole(
	db: DbInstance,
	userId: string,
	newRole: UserRole,
) {
	return await db
		.update(user)
		.set({
			role: newRole,
			updatedAt: new Date(),
		})
		.where(eq(user.id, userId))
		.returning();
}

/**
 * Get users by role
 */
export async function getUsersByRole(db: DbInstance, role: UserRole) {
	return await db.select().from(user).where(eq(user.role, role));
}

/**
 * Get all admins and superadmins
 */
export async function getAdminUsers(db: DbInstance) {
	return await db
		.select()
		.from(user)
		.where(sql`${user.role} IN ('admin', 'superadmin')`);
}

/**
 * Count users by role
 */
export async function countUsersByRole(db: DbInstance) {
	return await db
		.select({
			role: user.role,
			count: sql<number>`cast(count(*) as int)`,
		})
		.from(user)
		.groupBy(user.role);
}

/**
 * Promote user to admin
 */
export async function promoteToAdmin(db: DbInstance, userId: string) {
	return await updateUserRole(db, userId, "admin");
}

/**
 * Demote admin to user
 */
export async function demoteToUser(db: DbInstance, userId: string) {
	return await updateUserRole(db, userId, "user");
}
