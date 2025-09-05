import { useAuth as useClerkAuth, useUser } from "@clerk/react-router";
import type { UserResource } from "@clerk/types";
import { createContext, useContext } from "react";

export type UserRole = "user" | "admin" | "superadmin";
export type Permission = string;

export interface AuthContextValue {
	user: {
		id: string;
		email: string | undefined;
		name: string | null;
		image: string;
		roles: UserRole[];
		createdAt: Date | null;
		updatedAt: Date | null;
	} | null;
	isAuthenticated: boolean;
	isPending: boolean;
	error: unknown;
	hasPermission: (permission: Permission) => boolean;
	hasRole: (role: UserRole) => boolean;
	isAdmin: () => boolean;
	isSuperAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
	const { isLoaded: isAuthLoaded } = useClerkAuth();

	const isPending = !isUserLoaded || !isAuthLoaded;
	const isAuthenticated = isSignedIn ?? false;

	// Get roles from Clerk's publicMetadata
	const userRoles = (user?.publicMetadata?.roles as UserRole[]) || ["user"];

	const hasRole = (role: UserRole) => {
		return userRoles.includes(role);
	};

	const hasPermission = (permission: Permission) => {
		// Implement permission logic based on roles
		// For now, admins and superadmins have all permissions
		return hasRole("admin") || hasRole("superadmin");
	};

	const isAdmin = () => hasRole("admin") || hasRole("superadmin");
	const isSuperAdmin = () => hasRole("superadmin");

	const value: AuthContextValue = {
		user: user
			? {
					id: user.id,
					email: user.primaryEmailAddress?.emailAddress,
					name: user.fullName || user.firstName || user.username,
					image: user.imageUrl,
					roles: userRoles,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				}
			: null,
		isAuthenticated,
		isPending,
		error: null,
		hasPermission,
		hasRole,
		isAdmin,
		isSuperAdmin,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
