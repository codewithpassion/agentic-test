import { useQuery } from "convex/react";
import { useFetcher } from "react-router";
import type { Permission, UserRole } from "~/types/auth";
import { api } from "../../convex/_generated/api";

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

// Fetch users from Convex
export function useUsers(options: UseUsersOptions = {}) {
	const data = useQuery(api.users.listUsers, {
		search: options.search,
		role: options.role,
		limit: options.limit,
		offset: options.offset,
	});

	return {
		data: data as UsersResponse | undefined,
		isLoading: data === undefined,
		error: null as { message: string } | null,
	};
}

// Fetch user statistics
export function useUserStats() {
	const data = useQuery(api.users.getUserStats);

	return {
		data: data as UserStats | null,
		isLoading: data === undefined,
		error: null as { message: string } | null,
	};
}

// Static role information
export function useRoleInfo() {
	const roleInfo: RoleInfoResponse = {
		roles: [
			{
				name: "user",
				level: 1,
				label: "User",
				description: "Standard user with basic access permissions",
				permissions: [],
			},
			{
				name: "admin",
				level: 2,
				label: "Administrator",
				description:
					"Administrator with elevated permissions to manage users and access admin dashboard",
				permissions: ["users.view", "admin.access"],
			},
			{
				name: "superadmin",
				level: 3,
				label: "Super Administrator",
				description:
					"Super administrator with full system access including user and role management",
				permissions: [
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

// Fetch single user by ID
export function useUser(id: string, enabled = true) {
	const data = useQuery(
		api.users.getUserById,
		enabled ? { userId: id } : "skip",
	);

	return {
		data: data || null,
		isLoading: data === undefined && enabled,
		error: null as { message: string } | null,
	};
}

// Hook for updating user roles via server action
export function useUpdateUser() {
	const fetcher = useFetcher();

	const mutate = (data: { userId: string; roles: UserRole[] }) => {
		const formData = new FormData();
		formData.append("intent", "updateRoles");
		formData.append("userId", data.userId);
		formData.append("roles", JSON.stringify(data.roles));
		fetcher.submit(formData, {
			method: "POST",
			action: "/admin/users/api",
		});
	};

	const mutateAsync = async (data: { userId: string; roles: UserRole[] }) => {
		return new Promise((resolve, reject) => {
			const formData = new FormData();
			formData.append("intent", "updateRoles");
			formData.append("userId", data.userId);
			formData.append("roles", JSON.stringify(data.roles));

			fetcher.submit(formData, {
				method: "POST",
				action: "/admin/users/api",
			});

			// Wait for response
			setTimeout(() => {
				if (fetcher.data?.success) {
					resolve(fetcher.data);
				} else if (fetcher.data?.error) {
					reject(new Error(fetcher.data.error));
				} else {
					reject(new Error("Failed to update user"));
				}
			}, 1000);
		});
	};

	return {
		mutate,
		mutateAsync,
		isLoading: fetcher.state === "submitting",
		isPending: fetcher.state === "submitting",
		error: fetcher.data?.error
			? { message: fetcher.data.error }
			: (null as { message: string } | null),
	};
}

// Hook for assigning roles
export function useAssignRole() {
	const fetcher = useFetcher();

	const mutate = (data: { userId: string; role: UserRole }) => {
		const formData = new FormData();
		formData.append("intent", "addRole");
		formData.append("userId", data.userId);
		formData.append("role", data.role);
		fetcher.submit(formData, {
			method: "POST",
			action: "/admin/users/api",
		});
	};

	const mutateAsync = async (data: { userId: string; role: UserRole }) => {
		return new Promise((resolve, reject) => {
			const formData = new FormData();
			formData.append("intent", "addRole");
			formData.append("userId", data.userId);
			formData.append("role", data.role);

			fetcher.submit(formData, {
				method: "POST",
				action: "/admin/users/api",
			});

			// Wait for response
			setTimeout(() => {
				if (fetcher.data?.success) {
					resolve(fetcher.data);
				} else if (fetcher.data?.error) {
					reject(new Error(fetcher.data.error));
				} else {
					reject(new Error("Failed to assign role"));
				}
			}, 1000);
		});
	};

	return {
		mutate,
		mutateAsync,
		isLoading: fetcher.state === "submitting",
		isPending: fetcher.state === "submitting",
		error: fetcher.data?.error
			? { message: fetcher.data.error }
			: (null as { message: string } | null),
	};
}

// Hook for promoting users
export function usePromoteUser() {
	const fetcher = useFetcher();

	const mutate = (userId: string) => {
		const formData = new FormData();
		formData.append("intent", "promote");
		formData.append("userId", userId);
		fetcher.submit(formData, {
			method: "POST",
			action: "/admin/users/api",
		});
	};

	return {
		mutate,
		isLoading: fetcher.state === "submitting",
		error: fetcher.data?.error
			? { message: fetcher.data.error }
			: (null as { message: string } | null),
	};
}

// Hook for demoting users
export function useDemoteUser() {
	const fetcher = useFetcher();

	const mutate = (userId: string) => {
		const formData = new FormData();
		formData.append("intent", "demote");
		formData.append("userId", userId);
		fetcher.submit(formData, {
			method: "POST",
			action: "/admin/users/api",
		});
	};

	return {
		mutate,
		isLoading: fetcher.state === "submitting",
		error: fetcher.data?.error
			? { message: fetcher.data.error }
			: (null as { message: string } | null),
	};
}

// Note: User creation is handled through Clerk's dashboard
export function useCreateUser() {
	return {
		mutate: () => {},
		mutateAsync: async (_data: unknown) => {
			throw new Error(
				"User creation should be done through Clerk dashboard or signup flow",
			);
		},
		isLoading: false,
		isPending: false,
		error: null as { message: string } | null,
	};
}
