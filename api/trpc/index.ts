import { router } from "./router";
import { categoriesRouter } from "./routers/categories";
import { competitionsRouter } from "./routers/competitions";
import { dashboardRouter } from "./routers/dashboard";
import { photosRouter } from "./routers/photos";
import { usersRouter } from "./routers/users";
// Import other routers as they're created
// import { votesRouter } from "./routers/votes";
// import { reportsRouter } from "./routers/reports";
// import { winnersRouter } from "./routers/winners";

export const appRouter = router({
	competitions: competitionsRouter,
	categories: categoriesRouter,
	dashboard: dashboardRouter,
	photos: photosRouter,
	users: usersRouter,
	// Add other routers as they're created
	// votes: votesRouter,
	// reports: reportsRouter,
	// winners: winnersRouter,
});

export type AppRouter = typeof appRouter;
