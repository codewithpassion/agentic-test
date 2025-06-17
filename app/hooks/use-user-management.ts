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

export function useUser(id: string, enabled = true) {
	return trpc.users.getById.useQuery({ id }, { enabled: enabled && !!id });
}

export function useUserStats() {
	return trpc.users.getStats.useQuery();
}

export function useRoleInfo() {
	return trpc.users.getRoleInfo.useQuery();
}

export function useUpdateUser() {
	const utils = trpc.useUtils();

	return trpc.users.update.useMutation({
		onSuccess: () => {
			// Invalidate user list and stats
			utils.users.list.invalidate();
			utils.users.getStats.invalidate();
		},
	});
}

export function useAssignRole() {
	const utils = trpc.useUtils();

	return trpc.users.assignRole.useMutation({
		onSuccess: () => {
			// Invalidate user list and stats
			utils.users.list.invalidate();
			utils.users.getStats.invalidate();
		},
	});
}

export function useCreateUser() {
	const utils = trpc.useUtils();

	return trpc.users.create.useMutation({
		onSuccess: () => {
			// Invalidate user list and stats
			utils.users.list.invalidate();
			utils.users.getStats.invalidate();
		},
	});
}
