import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useDashboard() {
	return {
		// Dashboard overview - Convex automatically handles real-time updates
		useOverview: () => {
			const stats = useQuery(api.users.getAdminStats);
			return {
				data: stats || undefined,
				isLoading: stats === undefined,
				error: null as { message: string } | null, // Properly typed error for compatibility
				refetch: () => {
					// Convex queries are reactive and refetch automatically
					// This is a no-op for compatibility with the component
				},
				isRefetching: false, // Convex doesn't expose refetching state
			};
		},
	};
}
