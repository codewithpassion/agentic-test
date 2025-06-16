import { z } from "zod";
import { DashboardService } from "../../services/dashboard.service";
import { adminProcedure, router } from "../router";

export const dashboardRouter = router({
	// Dashboard overview metrics
	getOverview: adminProcedure.query(async ({ ctx }) => {
		const dashboardService = new DashboardService(ctx.db);
		return await dashboardService.getOverviewMetrics();
	}),

	// Competition analytics
	getCompetitionAnalytics: adminProcedure
		.input(z.object({ competitionId: z.string() }))
		.query(async ({ ctx, input }) => {
			const dashboardService = new DashboardService(ctx.db);
			return await dashboardService.getCompetitionAnalytics(
				input.competitionId,
			);
		}),

	// System statistics
	getSystemStats: adminProcedure.query(async ({ ctx }) => {
		const dashboardService = new DashboardService(ctx.db);
		return await dashboardService.getSystemStats();
	}),

	// User list with filters
	getUserList: adminProcedure
		.input(
			z
				.object({
					role: z.enum(["user", "admin", "superadmin", "all"]).optional(),
					search: z.string().optional(),
					limit: z.number().min(1).max(100).optional(),
					offset: z.number().min(0).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const dashboardService = new DashboardService(ctx.db);
			return await dashboardService.getUserList(input);
		}),
});
