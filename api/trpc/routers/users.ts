import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { canAssignRole, canModifyUser } from "../../../workers/permissions";
import { user } from "../../database/schema";
import {
	createUserSchema,
	userRoleSchema,
	userSearchSchema,
	userUpdateSchema,
} from "../../database/validations";
import {
	adminProcedure,
	protectedProcedure,
	router,
	superAdminProcedure,
} from "../router";

export const usersRouter = router({
	// Get paginated user list with search and filters (Admin+ only)
	list: adminProcedure.input(userSearchSchema).query(async ({ ctx, input }) => {
		const { db } = ctx;
		const { search, role, limit, offset } = input;

		// Build where conditions
		const conditions = [];

		// Search by name or email
		if (search) {
			conditions.push(
				or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`)),
			);
		}

		// Filter by role
		if (role) {
			conditions.push(eq(user.roles, role));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Get users with pagination
		const users = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				roles: user.roles,
				emailVerified: user.emailVerified,
				image: user.image,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			})
			.from(user)
			.where(whereClause)
			.orderBy(desc(user.createdAt))
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(user)
			.where(whereClause);

		return {
			users,
			totalCount: count,
			hasMore: offset + limit < count,
		};
	}),

	// Create new user (SuperAdmin only)
	create: superAdminProcedure
		.input(createUserSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, user: currentUser } = ctx;

			// Check if email already exists
			const existingUser = await db
				.select()
				.from(user)
				.where(eq(user.email, input.email))
				.get();

			if (existingUser) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A user with this email already exists",
				});
			}

			// Check if can assign this role
			if (!canAssignRole(currentUser, input.roles)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot assign this role",
				});
			}

			// Create the user
			const newUser = {
				id: crypto.randomUUID(),
				name: input.name,
				email: input.email,
				roles: input.roles,
				emailVerified: input.emailVerified,
				image: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const [createdUser] = await db.insert(user).values(newUser).returning();

			return createdUser;
		}),

	// Get user by ID (Admin+ only)
	getById: adminProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const { db } = ctx;
			const foundUser = await db
				.select()
				.from(user)
				.where(eq(user.id, input.id))
				.get();

			if (!foundUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			return foundUser;
		}),

	// Update user details (Admin+ only, role changes require SuperAdmin)
	update: adminProcedure
		.input(userUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			const { db, user: currentUser } = ctx;
			const { id, data } = input;

			// Get the target user
			const targetUser = await db
				.select()
				.from(user)
				.where(eq(user.id, id))
				.get();

			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Check if trying to modify role
			if (data.roles && data.roles !== targetUser.roles) {
				// Role changes require SuperAdmin
				if (!canAssignRole(currentUser, data.roles)) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "SuperAdmin role required to change user roles",
					});
				}

				// Check if can modify this specific user
				if (!canModifyUser(currentUser, targetUser)) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Cannot modify this user's role",
					});
				}
			}

			// Prevent users from modifying themselves
			if (currentUser.id === id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot modify your own account",
				});
			}

			// Build update object
			const updateData: Partial<typeof data> & { updatedAt: Date } = {
				updatedAt: new Date(),
			};

			if (data.name !== undefined) updateData.name = data.name;
			if (data.email !== undefined) updateData.email = data.email;
			if (data.roles !== undefined) updateData.roles = data.roles;
			if (data.emailVerified !== undefined)
				updateData.emailVerified = data.emailVerified;

			const [updatedUser] = await db
				.update(user)
				.set(updateData)
				.where(eq(user.id, id))
				.returning();

			return updatedUser;
		}),

	// Get user statistics
	getStats: adminProcedure.query(async ({ ctx }) => {
		const { db } = ctx;

		const stats = await db
			.select({
				totalUsers: sql<number>`count(*)`,
				totalAdmins: sql<number>`sum(case when ${user.roles} = 'admin' then 1 else 0 end)`,
				totalSuperAdmins: sql<number>`sum(case when ${user.roles} = 'superadmin' then 1 else 0 end)`,
				verifiedUsers: sql<number>`sum(case when ${user.emailVerified} = 1 then 1 else 0 end)`,
			})
			.from(user)
			.get();

		return stats;
	}),

	// Get role hierarchy and permissions (Admin+ only)
	getRoleInfo: adminProcedure.query(async () => {
		// Return role information for UI
		return {
			roles: [
				{
					name: "user",
					level: 1,
					label: "User",
					description: "Regular user with basic permissions",
					permissions: [
						"submit_photo",
						"vote_photo",
						"report_content",
						"edit_own_submission",
					],
				},
				{
					name: "admin",
					level: 2,
					label: "Admin",
					description: "Administrative access with moderation capabilities",
					permissions: [
						"submit_photo",
						"vote_photo",
						"report_content",
						"edit_own_submission",
						"moderate_content",
						"manage_competitions",
						"manage_categories",
						"view_reports",
						"select_winners",
					],
				},
				{
					name: "superadmin",
					level: 3,
					label: "Super Admin",
					description: "Full system access including user management",
					permissions: [
						"submit_photo",
						"vote_photo",
						"report_content",
						"edit_own_submission",
						"moderate_content",
						"manage_competitions",
						"manage_categories",
						"view_reports",
						"select_winners",
						"manage_users",
						"assign_roles",
						"system_config",
					],
				},
			],
		};
	}),

	// Assign role to user (SuperAdmin only)
	assignRole: superAdminProcedure
		.input(
			z.object({
				userId: z.string(),
				role: userRoleSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { db, user: currentUser } = ctx;
			const { userId, role } = input;

			// Get target user
			const targetUser = await db
				.select()
				.from(user)
				.where(eq(user.id, userId))
				.get();

			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Check if can assign this role
			if (!canAssignRole(currentUser, role)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot assign this role",
				});
			}

			// Check if can modify this user
			if (!canModifyUser(currentUser, targetUser)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot modify this user",
				});
			}

			const [updatedUser] = await db
				.update(user)
				.set({
					roles: role,
					updatedAt: new Date(),
				})
				.where(eq(user.id, userId))
				.returning();

			return updatedUser;
		}),
});
