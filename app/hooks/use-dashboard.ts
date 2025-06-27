import { trpc } from "~/lib/trpc";

export function useDashboard() {
	return {
		// Dashboard overview with auto-refresh
		useOverview: () =>
			trpc.dashboard.getOverview.useQuery(undefined, {
				refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
				staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
			}),
	};
}
