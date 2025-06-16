import { TRPCError } from "@trpc/server";
import { z } from "zod";
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
				const photo = await photoService.getPhotoById(input.id);

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
});
