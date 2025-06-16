import { router } from "./router";
import { categoriesRouter } from "./routers/categories";
import { competitionsRouter } from "./routers/competitions";
import { dashboardRouter } from "./routers/dashboard";
import { photosRouter } from "./routers/photos";
import { uploadRouter } from "./routers/upload";
// Import other routers as they're created
// import { votesRouter } from "./routers/votes";
// import { reportsRouter } from "./routers/reports";
// import { winnersRouter } from "./routers/winners";
// import { usersRouter } from "./routers/users";

export const appRouter = router({
	competitions: competitionsRouter,
	categories: categoriesRouter,
	dashboard: dashboardRouter,
	photos: photosRouter,
	upload: uploadRouter,
	// Add other routers as they're created
	// votes: votesRouter,
	// reports: reportsRouter,
	// winners: winnersRouter,
	// users: usersRouter,
});

export type AppRouter = typeof appRouter;
