import { router } from "./router";
import { dashboardRouter } from "./routers/dashboard";
import { todosRouter } from "./routers/todos";
import { usersRouter } from "./routers/users";

export const appRouter = router({
	dashboard: dashboardRouter,
	users: usersRouter,
	todos: todosRouter,
});

export type AppRouter = typeof appRouter;
