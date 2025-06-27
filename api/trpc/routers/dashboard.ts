import { z } from "zod";
import { DashboardService } from "../../services/dashboard.service";
import { adminProcedure, router } from "../router";

export const dashboardRouter = router({
	// Dashboard overview metrics
	getOverview: adminProcedure.query(async ({ ctx }) => {
		const dashboardService = new DashboardService(ctx.db);
		return await dashboardService.getOverview();
	}),
});
