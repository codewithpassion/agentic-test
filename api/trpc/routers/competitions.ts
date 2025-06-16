import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { isAdmin } from "../../../workers/permissions";
import { categories, competitions, photos } from "../../database/schema";
import {
	competitionStatusSchema,
	createCompetitionSchema,
} from "../../database/validations";
import {
	competitionManagerProcedure,
	protectedProcedure,
	publicProcedure,
	router,
} from "../router";

export const competitionsRouter = router({
	// Public procedures
	list: publicProcedure
		.input(
			z.object({
				status: z.enum(["active", "inactive", "draft", "completed"]).optional(),
				limit: z.number().min(1).max(100).default(20),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db } = ctx;
			const { status, limit, offset } = input;

			// Non-admins can only see active competitions
			if (!ctx.user || !isAdmin(ctx.user)) {
				return await db
					.select()
					.from(competitions)
					.where(eq(competitions.status, "active"))
					.orderBy(desc(competitions.createdAt))
					.limit(limit)
					.offset(offset);
			}

			if (status) {
				// Admins can filter by status
				return await db
					.select()
					.from(competitions)
					.where(eq(competitions.status, status))
					.orderBy(desc(competitions.createdAt))
					.limit(limit)
					.offset(offset);
			}

			// Admins can see all competitions when no status filter
			return await db
				.select()
				.from(competitions)
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
			if (
				competition.status !== "active" &&
				(!ctx.user || !isAdmin(ctx.user))
			) {
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

	getActiveWithStats: protectedProcedure.query(async ({ ctx }) => {
		const { db, user } = ctx;

		// Get all active competitions with stats
		const competitionsWithStats = await db
			.select({
				id: competitions.id,
				title: competitions.title,
				description: competitions.description,
				startDate: competitions.startDate,
				endDate: competitions.endDate,
				status: competitions.status,
				createdAt: competitions.createdAt,
				updatedAt: competitions.updatedAt,
				// Count categories for each competition
				categoryCount: sql<number>`(
					SELECT COUNT(*) 
					FROM ${categories} 
					WHERE ${categories.competitionId} = ${competitions.id}
				)`.as("categoryCount"),
				// Count user's submissions for each competition
				userSubmissionCount: sql<number>`(
					SELECT COUNT(*) 
					FROM ${photos} 
					WHERE ${photos.competitionId} = ${competitions.id} 
					AND ${photos.userId} = ${user.id}
					AND ${photos.status} != 'deleted'
				)`.as("userSubmissionCount"),
				// Count total submissions for each competition
				totalSubmissions: sql<number>`(
					SELECT COUNT(*) 
					FROM ${photos} 
					WHERE ${photos.competitionId} = ${competitions.id}
					AND ${photos.status} != 'deleted'
				)`.as("totalSubmissions"),
			})
			.from(competitions)
			.where(eq(competitions.status, "active"))
			.orderBy(competitions.endDate, competitions.createdAt);

		// Calculate days remaining for each competition
		const competitionsWithDays = competitionsWithStats.map((comp) => {
			let daysRemaining: number | null = null;

			if (comp.endDate) {
				const now = new Date();
				const end = new Date(comp.endDate);
				const diffTime = end.getTime() - now.getTime();
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				daysRemaining = Math.max(0, diffDays);
			}

			return {
				...comp,
				daysRemaining,
			};
		});

		return competitionsWithDays;
	}),

	getCategoriesWithStats: protectedProcedure
		.input(z.object({ competitionId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const { db, user } = ctx;
			const { competitionId } = input;

			// Get competition details
			const competition = await db
				.select()
				.from(competitions)
				.where(eq(competitions.id, competitionId))
				.get();

			if (!competition) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			// Check if competition is active
			if (competition.status !== "active") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Competition is not accepting submissions",
				});
			}

			// Get categories with submission stats
			const categoriesWithStats = await db
				.select({
					id: categories.id,
					name: categories.name,
					competitionId: categories.competitionId,
					maxPhotosPerUser: categories.maxPhotosPerUser,
					createdAt: categories.createdAt,
					updatedAt: categories.updatedAt,
					// Count user's submissions for each category
					userSubmissionCount: sql<number>`(
						SELECT COUNT(*) 
						FROM ${photos} 
						WHERE ${photos.categoryId} = ${categories.id} 
						AND ${photos.userId} = ${user.id}
						AND ${photos.status} != 'deleted'
					)`.as("userSubmissionCount"),
					// Count total submissions for each category
					totalSubmissions: sql<number>`(
						SELECT COUNT(*) 
						FROM ${photos} 
						WHERE ${photos.categoryId} = ${categories.id}
						AND ${photos.status} != 'deleted'
					)`.as("totalSubmissions"),
				})
				.from(categories)
				.where(eq(categories.competitionId, competitionId))
				.orderBy(categories.createdAt);

			// Calculate derived stats for each category
			const categoriesWithDerivedStats = categoriesWithStats.map((cat) => {
				const remainingSlots = Math.max(
					0,
					cat.maxPhotosPerUser - cat.userSubmissionCount,
				);
				const canSubmit = remainingSlots > 0 && competition.status === "active";

				return {
					...cat,
					canSubmit,
					remainingSlots,
				};
			});

			return {
				competition,
				categories: categoriesWithDerivedStats,
			};
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
				data: z.object({
					title: z.string().min(3).max(100).optional(),
					description: z.string().min(10).max(2000).optional(),
					startDate: z.date().optional(),
					endDate: z.date().optional(),
					status: competitionStatusSchema.optional(),
				}),
			}),
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

			// Create update object with only defined fields
			const updateData: Partial<typeof data> & { updatedAt: Date } = {
				updatedAt: new Date(),
			};

			if (data.title !== undefined) updateData.title = data.title;
			if (data.description !== undefined)
				updateData.description = data.description;
			if (data.startDate !== undefined) updateData.startDate = data.startDate;
			if (data.endDate !== undefined) updateData.endDate = data.endDate;
			if (data.status !== undefined) updateData.status = data.status;

			const [updated] = await db
				.update(competitions)
				.set(updateData)
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
