import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { categories, competitions } from "../../database/schema";
import { createCategorySchema } from "../../database/validations";
import {
	competitionManagerProcedure,
	publicProcedure,
	router,
} from "../router";

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
						eq(categories.name, input.name),
					),
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
			}),
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
							ne(categories.id, id),
						),
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
