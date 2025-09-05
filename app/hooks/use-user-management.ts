import { trpc } from "~/lib/trpc";
import type { UserRole } from "~/types/auth";

interface UseUsersOptions {
	search?: string;
	role?: UserRole;
	limit?: number;
	offset?: number;
}

export function useUsers(options: UseUsersOptions = {}) {
	return trpc.users.list.useQuery({
		search: options.search || "",
		role: options.role,
		limit: options.limit || 20,
		offset: options.offset || 0,
	});
}

export function useUserStats() {
	return trpc.users.getStats.useQuery();
}

export function useRoleInfo() {
	return trpc.users.getRoleInfo.useQuery();
}

// Stubs for compatibility - actual user management happens in Clerk dashboard
export function useUser(id: string, enabled = true) {
	return {
		data: null,
		isLoading: false,
		error: null,
	};
}

export function useUpdateUser() {
	return {
		mutate: () => {},
		mutateAsync: async (data: unknown) => {
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
		mutateAsync: async (data: unknown) => {
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
		mutateAsync: async (data: unknown) => {
			// Placeholder - actual user creation happens in Clerk dashboard
			throw new Error("User creation is managed through Clerk dashboard");
		},
		isLoading: false,
		isPending: false,
		error: null as { message: string } | null,
	};
}
