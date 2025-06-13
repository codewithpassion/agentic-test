import {
	canPerformAction,
	hasPermission,
	hasRole,
	isAdmin,
	isSuperAdmin,
} from "../../workers/permissions";
import type { AuthUser, Permission, UserRole } from "../../workers/types";
import { useSession } from "./auth-client";

/**
 * React hook for authentication with role information
 */
export function useAuthUser(user?: AuthUser) {
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
export function usePermissions(user: AuthUser | undefined) {
	if (!user) {
		return {
			hasPermission: () => false,
			hasRole: () => false,
			isAdmin: () => false,
			isSuperAdmin: () => false,
			canPerformAction: () => false,
		};
	}
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
			if (!user || !user.roles) return null;
			for (const role of user.roles) {
				if (components[role]) {
					return components[role];
				}
			}
			return null;
		},
	};
}
