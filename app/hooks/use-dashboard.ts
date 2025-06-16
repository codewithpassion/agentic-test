import { trpc } from "~/lib/trpc";

export function useDashboard() {
	return {
		// Dashboard overview with auto-refresh
		useOverview: () =>
			trpc.dashboard.getOverview.useQuery(undefined, {
				refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
				staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
			}),

		// Competition analytics
		useCompetitionAnalytics: (competitionId: string) =>
			trpc.dashboard.getCompetitionAnalytics.useQuery(
				{ competitionId },
				{ enabled: !!competitionId },
			),

		// System statistics
		useSystemStats: () =>
			trpc.dashboard.getSystemStats.useQuery(undefined, {
				staleTime: 10 * 60 * 1000, // System stats change less frequently
			}),

		// User list with filters
		useUserList: (filters?: {
			role?: "user" | "admin" | "superadmin" | "all";
			search?: string;
			limit?: number;
			offset?: number;
		}) =>
			trpc.dashboard.getUserList.useQuery(filters, {
				staleTime: 5 * 60 * 1000, // Cache for 5 minutes
			}),
	};
}
