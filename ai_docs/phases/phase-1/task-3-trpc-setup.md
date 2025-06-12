# Task 3: tRPC Router Setup

## Overview
Create the foundational tRPC router infrastructure with type-safe procedures and role-based authentication middleware for all competition platform entities.

## Goals
- Set up base tRPC router configuration
- Create authentication middleware
- Define routers for all entities (competitions, categories, photos, votes, reports, winners)
- Implement type-safe procedures with role-based protection
- Set up client-side tRPC integration

## tRPC Base Configuration

### File: `api/trpc/context.ts`

```typescript
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createDb } from "../database/db";
import { getAuthUser } from "../../workers/auth-utils";
import { AuthUser } from "~~packages/better-auth/types";

export interface Context {
	db: ReturnType<typeof createDb>;
	user: AuthUser | null;
	request: Request;
}

export async function createContext({
	req,
	env,
}: FetchCreateContextFnOptions & { env: CloudflareBindings }): Promise<Context> {
	const db = createDb(env.DB);
	const user = await getAuthUser(req);

	return {
		db,
		user,
		request: req,
	};
}

export type TRPCContext = Context;
```

### File: `api/trpc/router.ts`

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import { type Context } from "./context";
import { hasPermission, hasRole, isAdmin } from "~~packages/better-auth/permissions";
import { Permission, UserRole } from "~~packages/better-auth/types";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				code: error.code,
				httpStatus:
					error.code === "UNAUTHORIZED"
						? 401
						: error.code === "FORBIDDEN"
						? 403
						: error.code === "NOT_FOUND"
						? 404
						: 500,
			},
		};
	},
});

// Base router and procedure
export const router = t.router;
export const publicProcedure = t.procedure;

// Authentication middleware
const authMiddleware = t.middleware(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}
	return next({
		ctx: {
			...ctx,
			user: ctx.user, // Type is now non-null
		},
	});
});

// Role-based middleware factory
const roleMiddleware = (requiredRole: UserRole) =>
	t.middleware(({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		if (!hasRole(ctx.user, requiredRole)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `${requiredRole} role required`,
			});
		}

		return next({
			ctx: {
				...ctx,
				user: ctx.user,
			},
		});
	});

// Permission-based middleware factory
const permissionMiddleware = (requiredPermission: Permission) =>
	t.middleware(({ ctx, next }) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		if (!hasPermission(ctx.user, requiredPermission)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `Permission required: ${requiredPermission}`,
			});
		}

		return next({
			ctx: {
				...ctx,
				user: ctx.user,
			},
		});
	});

// Procedure variants
export const protectedProcedure = publicProcedure.use(authMiddleware);
export const adminProcedure = protectedProcedure.use(roleMiddleware("admin"));
export const superAdminProcedure = protectedProcedure.use(roleMiddleware("superadmin"));

// Permission-specific procedures
export const moderatorProcedure = protectedProcedure.use(
	permissionMiddleware("moderate_content")
);
export const competitionManagerProcedure = protectedProcedure.use(
	permissionMiddleware("manage_competitions")
);

// Ownership middleware factory
export const ownershipMiddleware = (getUserId: (input: any) => string) =>
	t.middleware(({ ctx, input, next }) => {
		if (!ctx.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		const resourceUserId = getUserId(input);
		
		// Allow if user owns the resource or is admin
		if (ctx.user.id !== resourceUserId && !isAdmin(ctx.user)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Access denied: insufficient permissions",
			});
		}

		return next({
			ctx: {
				...ctx,
				user: ctx.user,
			},
		});
	});
```

## Entity Routers

### File: `api/trpc/routers/competitions.ts`

```typescript
import { z } from "zod";
import { router, publicProcedure, adminProcedure, competitionManagerProcedure } from "../router";
import { competitions, categories } from "../../database/schema";
import { createCompetitionSchema } from "../../database/validations";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const competitionsRouter = router({
	// Public procedures
	list: publicProcedure
		.input(
			z.object({
				status: z.enum(["active", "inactive", "draft", "completed"]).optional(),
				limit: z.number().min(1).max(100).default(20),
				offset: z.number().min(0).default(0),
			})
		)
		.query(async ({ ctx, input }) => {
			const { db } = ctx;
			const { status, limit, offset } = input;

			let query = db.select().from(competitions);

			if (status) {
				query = query.where(eq(competitions.status, status));
			}

			// Non-admins can only see active competitions
			if (!ctx.user || !isAdmin(ctx.user)) {
				query = query.where(eq(competitions.status, "active"));
			}

			return await query
				.orderBy(desc(competitions.createdAt))
				.limit(limit)
				.offset(offset);
		}),

	getById: publicProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const { db } = ctx;
			const competition = await db
				.select()
				.from(competitions)
				.where(eq(competitions.id, input.id))
				.get();

			if (!competition) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			// Non-admins can only see active competitions
			if (competition.status !== "active" && (!ctx.user || !isAdmin(ctx.user))) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			return competition;
		}),

	getActive: publicProcedure.query(async ({ ctx }) => {
		const { db } = ctx;
		return await db
			.select()
			.from(competitions)
			.where(eq(competitions.status, "active"))
			.get();
	}),

	// Admin procedures
	create: competitionManagerProcedure
		.input(createCompetitionSchema)
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;
			
			// Check if trying to create an active competition when one already exists
			if (input.status === "active") {
				const activeCompetition = await db
					.select()
					.from(competitions)
					.where(eq(competitions.status, "active"))
					.get();

				if (activeCompetition) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "An active competition already exists",
					});
				}
			}

			const newCompetition = {
				id: crypto.randomUUID(),
				...input,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const [created] = await db
				.insert(competitions)
				.values(newCompetition)
				.returning();

			// Create default categories if competition is created
			if (created) {
				const defaultCategories = [
					{
						id: crypto.randomUUID(),
						name: "Urban",
						competitionId: created.id,
						maxPhotosPerUser: 5,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					{
						id: crypto.randomUUID(),
						name: "Landscape",
						competitionId: created.id,
						maxPhotosPerUser: 5,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				];

				await db.insert(categories).values(defaultCategories);
			}

			return created;
		}),

	update: competitionManagerProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: createCompetitionSchema.partial(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;
			const { id, data } = input;

			// Check if competition exists
			const existing = await db
				.select()
				.from(competitions)
				.where(eq(competitions.id, id))
				.get();

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			// Check active competition constraint
			if (data.status === "active" && existing.status !== "active") {
				const activeCompetition = await db
					.select()
					.from(competitions)
					.where(eq(competitions.status, "active"))
					.get();

				if (activeCompetition) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "An active competition already exists",
					});
				}
			}

			const [updated] = await db
				.update(competitions)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(competitions.id, id))
				.returning();

			return updated;
		}),

	delete: competitionManagerProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			const deleted = await db
				.delete(competitions)
				.where(eq(competitions.id, input.id))
				.returning();

			if (deleted.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			return { success: true };
		}),

	activate: competitionManagerProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			// Deactivate any currently active competition
			await db
				.update(competitions)
				.set({ status: "inactive", updatedAt: new Date() })
				.where(eq(competitions.status, "active"));

			// Activate the specified competition
			const [activated] = await db
				.update(competitions)
				.set({ status: "active", updatedAt: new Date() })
				.where(eq(competitions.id, input.id))
				.returning();

			if (!activated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			return activated;
		}),

	deactivate: competitionManagerProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			const [deactivated] = await db
				.update(competitions)
				.set({ status: "inactive", updatedAt: new Date() })
				.where(eq(competitions.id, input.id))
				.returning();

			if (!deactivated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			return deactivated;
		}),
});
```

### File: `api/trpc/routers/categories.ts`

```typescript
import { z } from "zod";
import { router, publicProcedure, competitionManagerProcedure } from "../router";
import { categories, competitions } from "../../database/schema";
import { createCategorySchema } from "../../database/validations";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const categoriesRouter = router({
	// Public procedures
	listByCompetition: publicProcedure
		.input(z.object({ competitionId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const { db } = ctx;
			return await db
				.select()
				.from(categories)
				.where(eq(categories.competitionId, input.competitionId));
		}),

	getById: publicProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const { db } = ctx;
			const category = await db
				.select()
				.from(categories)
				.where(eq(categories.id, input.id))
				.get();

			if (!category) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			return category;
		}),

	// Admin procedures
	create: competitionManagerProcedure
		.input(createCategorySchema)
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			// Verify competition exists
			const competition = await db
				.select()
				.from(competitions)
				.where(eq(competitions.id, input.competitionId))
				.get();

			if (!competition) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			// Check for duplicate category name in competition
			const existing = await db
				.select()
				.from(categories)
				.where(
					and(
						eq(categories.competitionId, input.competitionId),
						eq(categories.name, input.name)
					)
				)
				.get();

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Category name already exists in this competition",
				});
			}

			const newCategory = {
				id: crypto.randomUUID(),
				...input,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const [created] = await db
				.insert(categories)
				.values(newCategory)
				.returning();

			return created;
		}),

	update: competitionManagerProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: createCategorySchema.omit({ competitionId: true }).partial(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;
			const { id, data } = input;

			// Check if category exists
			const existing = await db
				.select()
				.from(categories)
				.where(eq(categories.id, id))
				.get();

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			// Check for duplicate name if name is being updated
			if (data.name) {
				const duplicate = await db
					.select()
					.from(categories)
					.where(
						and(
							eq(categories.competitionId, existing.competitionId),
							eq(categories.name, data.name),
							ne(categories.id, id)
						)
					)
					.get();

				if (duplicate) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Category name already exists in this competition",
					});
				}
			}

			const [updated] = await db
				.update(categories)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(categories.id, id))
				.returning();

			return updated;
		}),

	delete: competitionManagerProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { db } = ctx;

			// TODO: Check if category has any photos before deleting
			// This will be implemented in later phases

			const deleted = await db
				.delete(categories)
				.where(eq(categories.id, input.id))
				.returning();

			if (deleted.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			return { success: true };
		}),
});
```

## Main Router

### File: `api/trpc/index.ts`

```typescript
import { router } from "./router";
import { competitionsRouter } from "./routers/competitions";
import { categoriesRouter } from "./routers/categories";
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
```

## Client-Side tRPC Setup

### File: `app/lib/trpc.ts`

```typescript
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../api/trpc";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
	links: [
		httpBatchLink({
			url: "/api/trpc",
			// Include credentials for authentication
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: "include",
				});
			},
		}),
	],
});
```

### File: `app/providers/trpc-provider.tsx`

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { trpc, trpcClient } from "~/lib/trpc";

interface TRPCProviderProps {
	children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5 minutes
						retry: (failureCount, error: any) => {
							// Don't retry on 4xx errors
							if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
								return false;
							}
							return failureCount < 3;
						},
					},
				},
			})
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				{children}
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</trpc.Provider>
	);
}
```

## Worker Integration

### File: `workers/app.ts`

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../api/trpc";
import { createContext } from "../api/trpc/context";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// CORS configuration
app.use(
	"/api/*",
	cors({
		origin: (origin) => {
			// Allow all origins in development
			if (process.env.NODE_ENV === "development") return origin || "*";
			
			// Configure allowed origins for production
			const allowedOrigins = [
				"https://your-domain.com",
				"https://www.your-domain.com",
			];
			
			return allowedOrigins.includes(origin) ? origin : false;
		},
		credentials: true,
	})
);

// tRPC handler
app.all("/api/trpc/*", async (c) => {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req: c.req.raw,
		router: appRouter,
		createContext: (opts) => createContext({ ...opts, env: c.env }),
		onError: ({ error, path }) => {
			console.error(`tRPC Error on path '${path}':`, error);
		},
	});
});

// Health check
app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
```

## Router Stubs for Future Implementation

### File: `api/trpc/routers/_stubs.ts`

```typescript
// Placeholder routers for future implementation

import { router, publicProcedure, protectedProcedure, moderatorProcedure } from "../router";

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
```

## Success Criteria
- [ ] tRPC router infrastructure set up
- [ ] Authentication middleware working
- [ ] Role-based procedure protection implemented
- [ ] Competitions router fully functional
- [ ] Categories router fully functional
- [ ] Client-side tRPC integration complete
- [ ] Type safety maintained end-to-end
- [ ] Error handling working correctly
- [ ] Worker integration functional

## Dependencies
- Task 1: Database Schema
- Task 2: User Roles Extension
- tRPC libraries installed
- React Query setup

## Estimated Time
**1.5 days**

## Next Task
Task 4: Role-based Middleware - Implement route protection and UI rendering middleware