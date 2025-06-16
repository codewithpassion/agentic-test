import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { confirmUploadSchema, getSignedUrlSchema } from "../../lib/validation";
import { UploadService } from "../../services/upload-service";
import { protectedProcedure, router } from "../router";

export const uploadRouter = router({
	/**
	 * Get signed URL for direct upload to R2
	 */
	getSignedUrl: protectedProcedure
		.input(getSignedUrlSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const uploadService = new UploadService(ctx.env.PHOTO_STORAGE);
				const uploadDetails = await uploadService.getSignedUrl(input);
				return uploadDetails;
			} catch (error) {
				console.error("Get signed URL error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "Failed to generate upload URL",
				});
			}
		}),

	/**
	 * Confirm successful upload and validate file
	 */
	confirmUpload: protectedProcedure
		.input(confirmUploadSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const uploadService = new UploadService(ctx.env.PHOTO_STORAGE);
				const result = await uploadService.confirmUpload(input);
				return result;
			} catch (error) {
				console.error("Confirm upload error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "Failed to confirm upload",
				});
			}
		}),

	/**
	 * Delete file from R2 storage
	 */
	deleteFile: protectedProcedure
		.input(z.object({ filePath: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const uploadService = new UploadService(ctx.env.PHOTO_STORAGE);
				await uploadService.deleteFile(input.filePath);
				return { success: true };
			} catch (error) {
				console.error("Delete file error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "Failed to delete file",
				});
			}
		}),

	/**
	 * Get file info from R2
	 */
	getFileInfo: protectedProcedure
		.input(z.object({ filePath: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const uploadService = new UploadService(ctx.env.PHOTO_STORAGE);
				const fileInfo = await uploadService.getFileInfo(input.filePath);
				return fileInfo;
			} catch (error) {
				console.error("Get file info error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "Failed to get file info",
				});
			}
		}),

	/**
	 * Get signed URL for viewing/downloading file
	 */
	getViewUrl: protectedProcedure
		.input(
			z.object({
				filePath: z.string(),
				expiresIn: z.number().min(60).max(3600).default(3600), // 1 minute to 1 hour
			}),
		)
		.query(async ({ ctx, input }) => {
			try {
				const uploadService = new UploadService(ctx.env.PHOTO_STORAGE);
				const viewUrl = await uploadService.getViewUrl(
					input.filePath,
					input.expiresIn,
				);
				return { url: viewUrl };
			} catch (error) {
				console.error("Get view URL error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "Failed to generate view URL",
				});
			}
		}),

	/**
	 * Generate thumbnail (placeholder for future implementation)
	 */
	generateThumbnail: protectedProcedure
		.input(z.object({ filePath: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const uploadService = new UploadService(ctx.env.PHOTO_STORAGE);
				const thumbnailPath = await uploadService.generateThumbnail(
					input.filePath,
				);
				return { thumbnailPath };
			} catch (error) {
				console.error("Generate thumbnail error:", error);
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "Failed to generate thumbnail",
				});
			}
		}),
});
