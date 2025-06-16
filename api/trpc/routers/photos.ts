import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { categories, competitions, photos } from "../../database/schema";
import {
	getPhotosByCategorySchema,
	getPhotosByCompetitionSchema,
	getUserSubmissionsSchema,
	photoSubmissionSchema,
	photoUpdateSchema,
} from "../../lib/validation";
import { PhotoService } from "../../services/photo-service";
import {
	adminProcedure,
	protectedProcedure,
	publicProcedure,
	router,
} from "../router";

export const photosRouter = router({
	/**
	 * Submit a new photo
	 */
	submit: protectedProcedure
		.input(photoSubmissionSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const photoService = new PhotoService(ctx.env.DB);
				const photo = await photoService.submitPhoto(ctx.user.id, input);
				return photo;
			} catch (error) {
				console.error("Photo submission error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "Failed to submit photo",
				});
			}
		}),

	/**
	 * Update photo metadata
	 */
	update: protectedProcedure
		.input(photoUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { id, ...updates } = input;
				const photoService = new PhotoService(ctx.env.DB);
				const photo = await photoService.updatePhoto(id, ctx.user.id, updates);
				return photo;
			} catch (error) {
				console.error("Photo update error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "Failed to update photo",
				});
			}
		}),

	/**
	 * Delete user's photo
	 */
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const photoService = new PhotoService(ctx.env.DB);
				await photoService.deletePhoto(input.id, ctx.user.id);
				return { success: true };
			} catch (error) {
				console.error("Photo deletion error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "Failed to delete photo",
				});
			}
		}),

	/**
	 * Get user's submissions
	 */
	getUserSubmissions: protectedProcedure
		.input(getUserSubmissionsSchema)
		.query(async ({ ctx, input }) => {
			try {
				const photoService = new PhotoService(ctx.env.DB);
				return await photoService.getUserSubmissions(ctx.user.id, input);
			} catch (error) {
				console.error("Get user submissions error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch submissions",
				});
			}
		}),

	/**
	 * Get photos by category (public)
	 */
	getByCategory: publicProcedure
		.input(getPhotosByCategorySchema)
		.query(async ({ ctx, input }) => {
			try {
				const { categoryId, ...options } = input;
				const photoService = new PhotoService(ctx.env.DB);
				return await photoService.getPhotosByCategory(categoryId, options);
			} catch (error) {
				console.error("Get photos by category error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch photos",
				});
			}
		}),

	/**
	 * Get photos by competition (public)
	 */
	getByCompetition: publicProcedure
		.input(getPhotosByCompetitionSchema)
		.query(async ({ ctx, input }) => {
			try {
				const { competitionId, ...options } = input;
				const photoService = new PhotoService(ctx.env.DB);
				return await photoService.getPhotosByCompetition(
					competitionId,
					options,
				);
			} catch (error) {
				console.error("Get photos by competition error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch photos",
				});
			}
		}),

	/**
	 * Get single photo by ID (public for approved photos)
	 */
	getById: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const photoService = new PhotoService(ctx.env.DB);
				const photo = await photoService.getPhotoByIdWithRelations(input.id);

				if (!photo) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Photo not found",
					});
				}

				// Only show approved photos to public, or own photos to authenticated users
				if (
					photo.status !== "approved" &&
					(!ctx.user || photo.userId !== ctx.user.id)
				) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Photo not found",
					});
				}

				return photo;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("Get photo by ID error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch photo",
				});
			}
		}),

	/**
	 * Admin: Get photos for moderation
	 */
	getForModeration: adminProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(20),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			try {
				const photoService = new PhotoService(ctx.env.DB);
				return await photoService.getPhotosForModeration(input);
			} catch (error) {
				console.error("Get photos for moderation error:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch photos for moderation",
				});
			}
		}),

	/**
	 * Admin: Moderate photo (approve/reject)
	 */
	moderate: adminProcedure
		.input(
			z.object({
				photoId: z.string(),
				action: z.enum(["approve", "reject"]),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const photoService = new PhotoService(ctx.env.DB);
				const photo = await photoService.moderatePhoto(
					input.photoId,
					ctx.user.id,
					input.action,
					input.reason,
				);
				return photo;
			} catch (error) {
				console.error("Photo moderation error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "Failed to moderate photo",
				});
			}
		}),

	/**
	 * Get user's submission statistics
	 */
	getSubmissionStats: protectedProcedure.query(async ({ ctx }) => {
		const { db, user } = ctx;

		// Get overall statistics
		const totalStats = await db
			.select({
				total: sql<number>`COUNT(*)`,
				pending: sql<number>`SUM(CASE WHEN ${photos.status} = 'pending' THEN 1 ELSE 0 END)`,
				approved: sql<number>`SUM(CASE WHEN ${photos.status} = 'approved' THEN 1 ELSE 0 END)`,
				rejected: sql<number>`SUM(CASE WHEN ${photos.status} = 'rejected' THEN 1 ELSE 0 END)`,
			})
			.from(photos)
			.where(
				and(eq(photos.userId, user.id), sql`${photos.status} != 'deleted'`),
			)
			.get();

		// Get competitions entered count
		const competitionsEntered = await db
			.select({
				count: sql<number>`COUNT(DISTINCT ${photos.competitionId})`,
			})
			.from(photos)
			.where(
				and(eq(photos.userId, user.id), sql`${photos.status} != 'deleted'`),
			)
			.get();

		// Get recent activity (last 5 submissions)
		const recentActivity = await db
			.select({
				id: photos.id,
				title: photos.title,
				status: photos.status,
				createdAt: photos.createdAt,
				competitionTitle: competitions.title,
				categoryName: categories.name,
			})
			.from(photos)
			.innerJoin(competitions, eq(photos.competitionId, competitions.id))
			.innerJoin(categories, eq(photos.categoryId, categories.id))
			.where(
				and(eq(photos.userId, user.id), sql`${photos.status} != 'deleted'`),
			)
			.orderBy(sql`${photos.createdAt} DESC`)
			.limit(5);

		return {
			totalSubmissions: totalStats?.total || 0,
			pendingSubmissions: totalStats?.pending || 0,
			approvedSubmissions: totalStats?.approved || 0,
			rejectedSubmissions: totalStats?.rejected || 0,
			competitionsEntered: competitionsEntered?.count || 0,
			recentActivity,
		};
	}),

	/**
	 * Get submission context (competition + category + remaining slots)
	 */
	getSubmissionContext: protectedProcedure
		.input(
			z.object({
				competitionId: z.string().uuid(),
				categoryId: z.string().uuid(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { db, user } = ctx;
			const { competitionId, categoryId } = input;

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

			// Get category details
			const category = await db
				.select()
				.from(categories)
				.where(
					and(
						eq(categories.id, categoryId),
						eq(categories.competitionId, competitionId),
					),
				)
				.get();

			if (!category) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			// Check user's current submission count for this category
			const userSubmissions = await db
				.select({ count: sql<number>`COUNT(*)` })
				.from(photos)
				.where(
					and(
						eq(photos.userId, user.id),
						eq(photos.categoryId, categoryId),
						eq(photos.competitionId, competitionId),
					),
				)
				.get();

			const submissionCount = userSubmissions?.count || 0;
			const remainingSlots = Math.max(
				0,
				category.maxPhotosPerUser - submissionCount,
			);

			if (remainingSlots <= 0) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You have reached the submission limit for this category",
				});
			}

			return {
				competition,
				category,
				submissionCount,
				remainingSlots,
			};
		}),
});
