import { useAuthUser, usePermissions } from "@portcityai/better-auth/hooks";
import { createContext, useContext } from "react";
import type { AuthUser, Permission, UserRole } from "~/types/auth";
import type { AuthSession } from "~~/types";

export interface AuthContextValue {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isPending: boolean;
	error: unknown;
	hasPermission: (permission: Permission) => boolean;
	hasRole: (role: UserRole) => boolean;
	isAdmin: () => boolean;
	isSuperAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
	children,
	user,
}: { user: AuthUser | undefined; children: React.ReactNode }) {
	const { isAuthenticated, isPending, error, session } = useAuthUser(user);

	const { hasPermission, hasRole, isAdmin, isSuperAdmin } =
		usePermissions(user);

	const value: AuthContextValue = {
		user: user || null,
		isAuthenticated,
		isPending,
		error,
		hasPermission,
		hasRole,
		isAdmin,
		isSuperAdmin,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
