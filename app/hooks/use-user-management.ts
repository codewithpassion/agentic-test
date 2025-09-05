import type { Permission, UserRole } from "~/types/auth";

interface RoleInfo {
	name: UserRole;
	level: number;
	label: string;
	description: string;
	permissions: Permission[];
}

interface RoleInfoResponse {
	roles: RoleInfo[];
}

interface UseUsersOptions {
	search?: string;
	role?: UserRole;
	limit?: number;
	offset?: number;
}

interface User {
	id: string;
	name: string;
	email: string;
	image?: string;
	roles: UserRole;
	emailVerified: boolean;
	createdAt: string;
}

interface UsersResponse {
	users: User[];
	totalCount: number;
	hasMore: boolean;
}

interface UserStats {
	totalUsers: number;
	verifiedUsers: number;
	totalAdmins: number;
	totalSuperAdmins: number;
}

// Since user management is handled by Clerk, these are stubs for compatibility
export function useUsers(_options: UseUsersOptions = {}) {
	return {
		data: {
			users: [],
			totalCount: 0,
			hasMore: false,
		} as UsersResponse,
		isLoading: false,
		error: null as { message: string } | null,
	};
}

export function useUserStats() {
	return {
		data: {
			totalUsers: 0,
			verifiedUsers: 0,
			totalAdmins: 0,
			totalSuperAdmins: 0,
		} as UserStats,
		isLoading: false,
		error: null as { message: string } | null,
	};
}

export function useRoleInfo() {
	// Static role information based on the system's role hierarchy
	const roleInfo: RoleInfoResponse = {
		roles: [
			{
				name: "user",
				level: 1,
				label: "User",
				description: "Standard user with basic todo management permissions",
				permissions: ["todos.create_own", "todos.edit_own", "todos.delete_own"],
			},
			{
				name: "admin",
				level: 2,
				label: "Administrator",
				description:
					"Administrator with elevated permissions to manage todos and view all todos",
				permissions: [
					"todos.create_own",
					"todos.edit_own",
					"todos.delete_own",
					"todos.edit_all",
					"todos.view_all",
					"users.view",
					"admin.access",
				],
			},
			{
				name: "superadmin",
				level: 3,
				label: "Super Administrator",
				description:
					"Super administrator with full system access including user and role management",
				permissions: [
					"todos.create_own",
					"todos.edit_own",
					"todos.delete_own",
					"todos.edit_all",
					"todos.view_all",
					"todos.delete_all",
					"users.view",
					"users.create",
					"users.edit",
					"users.delete",
					"users.manage_roles",
					"admin.access",
					"admin.view_stats",
					"admin.manage_settings",
					"system.manage_api",
					"system.manage_security",
				],
			},
		],
	};

	return {
		data: roleInfo,
		isLoading: false,
		error: null as { message: string } | null,
	};
}

// Stubs for compatibility - actual user management happens in Clerk dashboard
export function useUser(_id: string, _enabled = true) {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}

export function useUpdateUser() {
	return {
		mutate: () => {},
		mutateAsync: async (_data: unknown) => {
			// Placeholder - actual user management happens in Clerk dashboard
			throw new Error("User updates are managed through Clerk dashboard");
		},
		isLoading: false,
		isPending: false,
		error: null as { message: string } | null,
	};
}

export function useAssignRole() {
	return {
		mutate: () => {},
		mutateAsync: async (_data: unknown) => {
			// Placeholder - actual role assignment happens in Clerk dashboard
			throw new Error("Role assignment is managed through Clerk dashboard");
		},
		isLoading: false,
		isPending: false,
		error: null as { message: string } | null,
	};
}

export function useCreateUser() {
	return {
		mutate: () => {},
		mutateAsync: async (_data: unknown) => {
			// Placeholder - actual user creation happens in Clerk dashboard
			throw new Error("User creation is managed through Clerk dashboard");
		},
		isLoading: false,
		isPending: false,
		error: null as { message: string } | null,
	};
}
