import { router } from "./router";
import { categoriesRouter } from "./routers/categories";
import { competitionsRouter } from "./routers/competitions";
// Import other routers as they're created
// import { photosRouter } from "./routers/photos";
// import { votesRouter } from "./routers/votes";
// import { reportsRouter } from "./routers/reports";
// import { winnersRouter } from "./routers/winners";
// import { usersRouter } from "./routers/users";

export const appRouter = router({
	competitions: competitionsRouter,
	categories: categoriesRouter,
	// Add other routers as they're created
	// photos: photosRouter,
	// votes: votesRouter,
	// reports: reportsRouter,
	// winners: winnersRouter,
	// users: usersRouter,
});

export type AppRouter = typeof appRouter;
