import { createClerkClient } from "@clerk/backend";
import type { UserRole } from "~/contexts/auth-context";

/**
 * Server-side Clerk admin functions for managing user roles
 * These should only be called from server actions or API routes
 */

// Initialize Clerk client
function getClerkClient(context: { cloudflare: { env: CloudflareBindings } }) {
	return createClerkClient({
		secretKey: context.cloudflare.env.CLERK_SECRET_KEY,
	});
}

/**
 * Update user roles in Clerk's publicMetadata
 */
export async function updateUserRoles(
	context: { cloudflare: { env: CloudflareBindings } },
	userId: string,
	roles: UserRole[],
) {
	const clerk = getClerkClient(context);

	try {
		const user = await clerk.users.updateUserMetadata(userId, {
			publicMetadata: {
				roles,
			},
		});

		return { success: true, user };
	} catch (error) {
		console.error("Failed to update user roles:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to update user roles",
		};
	}
}

/**
 * Add a role to a user
 */
export async function addUserRole(
	context: { cloudflare: { env: CloudflareBindings } },
	userId: string,
	role: UserRole,
) {
	const clerk = getClerkClient(context);

	try {
		// Get current user to fetch existing roles
		const user = await clerk.users.getUser(userId);
		const currentRoles = (user.publicMetadata?.roles as UserRole[]) || ["user"];

		// Add new role if not already present
		if (!currentRoles.includes(role)) {
			currentRoles.push(role);
		}

		return await updateUserRoles(context, userId, currentRoles);
	} catch (error) {
		console.error("Failed to add user role:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to add user role",
		};
	}
}

/**
 * Remove a role from a user
 */
export async function removeUserRole(
	context: { cloudflare: { env: CloudflareBindings } },
	userId: string,
	role: UserRole,
) {
	const clerk = getClerkClient(context);

	try {
		// Get current user to fetch existing roles
		const user = await clerk.users.getUser(userId);
		const currentRoles = (user.publicMetadata?.roles as UserRole[]) || ["user"];

		// Remove the role
		const newRoles = currentRoles.filter((r) => r !== role);

		// Ensure user always has at least "user" role
		if (newRoles.length === 0) {
			newRoles.push("user");
		}

		return await updateUserRoles(context, userId, newRoles);
	} catch (error) {
		console.error("Failed to remove user role:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to remove user role",
		};
	}
}

/**
 * Batch update roles for multiple users
 */
export async function batchUpdateUserRoles(
	context: { cloudflare: { env: CloudflareBindings } },
	updates: Array<{ userId: string; roles: UserRole[] }>,
) {
	const results = await Promise.allSettled(
		updates.map(({ userId, roles }) => updateUserRoles(context, userId, roles)),
	);

	const successes = results.filter(
		(r) => r.status === "fulfilled" && r.value.success,
	);
	const failures = results.filter(
		(r) =>
			r.status === "rejected" || (r.status === "fulfilled" && !r.value.success),
	);

	return {
		totalUpdated: successes.length,
		totalFailed: failures.length,
		results,
	};
}

/**
 * Check if a user has a specific role
 */
export async function userHasRole(
	context: { cloudflare: { env: CloudflareBindings } },
	userId: string,
	role: UserRole,
): Promise<boolean> {
	const clerk = getClerkClient(context);

	try {
		const user = await clerk.users.getUser(userId);
		const roles = (user.publicMetadata?.roles as UserRole[]) || ["user"];
		return roles.includes(role);
	} catch (error) {
		console.error("Failed to check user role:", error);
		return false;
	}
}

/**
 * Get all users with a specific role
 */
export async function getUsersByRole(
	context: { cloudflare: { env: CloudflareBindings } },
	role: UserRole,
	limit = 100,
) {
	const clerk = getClerkClient(context);

	try {
		// Get all users (paginated)
		const users = await clerk.users.getUserList({ limit });

		// Filter users with the specified role
		const usersWithRole = users.data.filter(
			(user: { publicMetadata?: { roles?: unknown } }) => {
				const roles = (user.publicMetadata?.roles as UserRole[]) || ["user"];
				return roles.includes(role);
			},
		);

		return {
			success: true,
			users: usersWithRole,
			count: usersWithRole.length,
		};
	} catch (error) {
		console.error("Failed to get users by role:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to get users by role",
			users: [],
			count: 0,
		};
	}
}

/**
 * Promote a user (user -> admin -> superadmin)
 */
export async function promoteUser(
	context: { cloudflare: { env: CloudflareBindings } },
	userId: string,
) {
	const clerk = getClerkClient(context);

	try {
		const user = await clerk.users.getUser(userId);
		const currentRoles = (user.publicMetadata?.roles as UserRole[]) || ["user"];

		let newRoles: UserRole[];

		if (currentRoles.includes("superadmin")) {
			// Already at highest role
			return {
				success: true,
				message: "User is already a superadmin",
				roles: currentRoles,
			};
		}
		if (currentRoles.includes("admin")) {
			// Promote to superadmin
			newRoles = ["user", "admin", "superadmin"];
		} else {
			// Promote to admin
			newRoles = ["user", "admin"];
		}

		const result = await updateUserRoles(context, userId, newRoles);
		return {
			...result,
			message: result.success
				? "User promoted successfully"
				: "Failed to promote user",
			roles: newRoles,
		};
	} catch (error) {
		console.error("Failed to promote user:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to promote user",
		};
	}
}

/**
 * Demote a user (superadmin -> admin -> user)
 */
export async function demoteUser(
	context: { cloudflare: { env: CloudflareBindings } },
	userId: string,
) {
	const clerk = getClerkClient(context);

	try {
		const user = await clerk.users.getUser(userId);
		const currentRoles = (user.publicMetadata?.roles as UserRole[]) || ["user"];

		let newRoles: UserRole[];

		if (currentRoles.includes("superadmin")) {
			// Demote to admin
			newRoles = ["user", "admin"];
		} else if (currentRoles.includes("admin")) {
			// Demote to user
			newRoles = ["user"];
		} else {
			// Already at lowest role
			return {
				success: true,
				message: "User is already at base role",
				roles: currentRoles,
			};
		}

		const result = await updateUserRoles(context, userId, newRoles);
		return {
			...result,
			message: result.success
				? "User demoted successfully"
				: "Failed to demote user",
			roles: newRoles,
		};
	} catch (error) {
		console.error("Failed to demote user:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to demote user",
		};
	}
}
