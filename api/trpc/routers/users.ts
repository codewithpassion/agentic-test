import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../router";

// User type for admin list view - matches Clerk user structure
export type AdminUserListItem = {
	id: string;
	email: string;
	name: string;
	image: string | null;
	roles: "user" | "admin" | "superadmin"; // Single role for display
	emailVerified: boolean;
	createdAt: string; // ISO string
};

// Note: User management is handled via Clerk dashboard
// These endpoints provide read-only access for admin UI

export const usersRouter = router({
	// Get user statistics (placeholder for Clerk integration)
	getStats: adminProcedure.query(async ({ ctx }) => {
		// In production, these would come from Clerk API
		return {
			totalUsers: 0,
			totalAdmins: 0,
			totalSuperAdmins: 0,
			verifiedUsers: 0,
		};
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
					permissions: ["create_todo", "edit_todo", "delete_todo"],
				},
				{
					name: "admin",
					level: 2,
					label: "Admin",
					description: "Administrative access with moderation capabilities",
					permissions: [
						"create_todo",
						"edit_todo",
						"delete_todo",
						"manage_todos",
						"view_all_todos",
					],
				},
				{
					name: "superadmin",
					level: 3,
					label: "Super Admin",
					description: "Full system access including user management",
					permissions: [
						"create_todo",
						"edit_todo",
						"delete_todo",
						"manage_todos",
						"view_all_todos",
						"manage_users",
						"assign_roles",
						"system_config",
					],
				},
			],
		};
	}),

	// Placeholder for user list - would integrate with Clerk API
	list: adminProcedure
		.input(
			z.object({
				search: z.string().optional(),
				role: z.enum(["user", "admin", "superadmin"]).optional(),
				limit: z.number().min(1).max(100).default(10),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(
			async ({
				ctx,
				input,
			}): Promise<{
				users: AdminUserListItem[];
				totalCount: number;
				hasMore: boolean;
			}> => {
				// In production, fetch from Clerk API
				// For now, return empty array with proper type
				const users: AdminUserListItem[] = [];

				return {
					users,
					totalCount: 0,
					hasMore: false,
				};
			},
		),
});
