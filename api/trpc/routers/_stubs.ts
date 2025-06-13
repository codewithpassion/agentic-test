// Placeholder routers for future implementation

import {
	moderatorProcedure,
	protectedProcedure,
	publicProcedure,
	router,
} from "../router";

export const photosRouter = router({
	// Will be implemented in Phase 3
	list: publicProcedure.query(() => []),
	submit: protectedProcedure.mutation(() => ({ success: false })),
	moderate: moderatorProcedure.mutation(() => ({ success: false })),
});

export const votesRouter = router({
	// Will be implemented in Phase 4
	toggle: protectedProcedure.mutation(() => ({ success: false })),
	getByPhoto: publicProcedure.query(() => ({ count: 0 })),
});

export const reportsRouter = router({
	// Will be implemented in Phase 5
	create: protectedProcedure.mutation(() => ({ success: false })),
	list: moderatorProcedure.query(() => []),
});

export const winnersRouter = router({
	// Will be implemented in Phase 6
	select: moderatorProcedure.mutation(() => ({ success: false })),
	getByCompetition: publicProcedure.query(() => []),
});

export const usersRouter = router({
	// Will be implemented as needed
	list: protectedProcedure.query(() => []),
	updateRole: protectedProcedure.mutation(() => ({ success: false })),
});
