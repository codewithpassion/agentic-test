import { auth } from "../packages/better-auth/auth";
import {
	hasPermission,
	hasRole,
	isAdmin,
} from "../packages/better-auth/permissions";
import type {
	AuthUser,
	Permission,
	UserRole,
} from "../packages/better-auth/types";

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		return (session?.user as AuthUser) || null;
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
	permission: Permission,
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
	role: UserRole,
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
	resourceUserId: string,
): Promise<AuthUser> {
	const user = await requireAuth(request);

	if (user.id !== resourceUserId && !isAdmin(user)) {
		throw new Error("Access denied: insufficient permissions");
	}

	return user;
}
