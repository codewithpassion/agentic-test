import { z } from "zod";

// File validation constants
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_WIDTH = 800;
export const MIN_HEIGHT = 600;

// Photo metadata validation
export const photoMetadataSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must be at most 100 characters"),
	description: z
		.string()
		.min(20, "Description must be at least 20 characters")
		.max(500, "Description must be at most 500 characters"),
	dateTaken: z
		.date()
		.max(new Date(), "Date taken cannot be in the future")
		.optional(),
	location: z
		.string()
		.min(2, "Location must be at least 2 characters")
		.max(100, "Location must be at most 100 characters"),

	// Camera info (all optional)
	cameraMake: z.string().max(50).optional(),
	cameraModel: z.string().max(100).optional(),
	lens: z.string().max(100).optional(),
	focalLength: z.string().max(20).optional(),
	aperture: z.string().max(10).optional(),
	shutterSpeed: z.string().max(20).optional(),
	iso: z.string().max(10).optional(),
});

// File validation schema
export const fileValidationSchema = z.object({
	fileName: z.string().min(1, "File name is required"),
	fileSize: z
		.number()
		.max(
			MAX_FILE_SIZE,
			`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
		),
	mimeType: z.enum(ALLOWED_MIME_TYPES, {
		errorMap: () => ({ message: "Only JPEG and PNG files are allowed" }),
	}),
	width: z
		.number()
		.min(MIN_WIDTH, `Image width must be at least ${MIN_WIDTH}px`),
	height: z
		.number()
		.min(MIN_HEIGHT, `Image height must be at least ${MIN_HEIGHT}px`),
});

// Photo submission schema
export const photoSubmissionSchema = z.object({
	competitionId: z.string().min(1, "Competition ID is required"),
	categoryId: z.string().min(1, "Category ID is required"),
	...photoMetadataSchema.shape,
	...fileValidationSchema.shape,
	filePath: z.string().min(1, "File path is required"),
});

// Photo update schema (only metadata can be updated)
export const photoUpdateSchema = z.object({
	id: z.string().min(1, "Photo ID is required"),
	...photoMetadataSchema.shape,
});

// Query schemas
export const getUserSubmissionsSchema = z.object({
	competitionId: z.string().optional(),
	categoryId: z.string().optional(),
	status: z.enum(["pending", "approved", "rejected", "deleted"]).optional(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

export const getPhotosByCategorySchema = z.object({
	categoryId: z.string().min(1, "Category ID is required"),
	status: z.enum(["approved"]).default("approved"),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

export const getPhotosByCompetitionSchema = z.object({
	competitionId: z.string().min(1, "Competition ID is required"),
	categoryId: z.string().optional(),
	status: z.enum(["approved"]).default("approved"),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

// Upload schemas
export const getSignedUrlSchema = z.object({
	fileName: z.string().min(1, "File name is required"),
	fileSize: z
		.number()
		.max(
			MAX_FILE_SIZE,
			`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
		),
	mimeType: z.enum(ALLOWED_MIME_TYPES, {
		errorMap: () => ({ message: "Only JPEG and PNG files are allowed" }),
	}),
	competitionId: z.string().min(1, "Competition ID is required"),
});

export const confirmUploadSchema = z.object({
	photoId: z.string().min(1, "Photo ID is required"),
	filePath: z.string().min(1, "File path is required"),
	width: z
		.number()
		.min(MIN_WIDTH, `Image width must be at least ${MIN_WIDTH}px`),
	height: z
		.number()
		.min(MIN_HEIGHT, `Image height must be at least ${MIN_HEIGHT}px`),
});

// Validation helper functions
export function validateImageDimensions(
	width: number,
	height: number,
): { valid: boolean; error?: string } {
	if (width < MIN_WIDTH || height < MIN_HEIGHT) {
		return {
			valid: false,
			error: `Image must be at least ${MIN_WIDTH}x${MIN_HEIGHT} pixels. Current: ${width}x${height}`,
		};
	}
	return { valid: true };
}

export function validateFileType(mimeType: string): {
	valid: boolean;
	error?: string;
} {
	if (
		!ALLOWED_MIME_TYPES.includes(
			mimeType as (typeof ALLOWED_MIME_TYPES)[number],
		)
	) {
		return {
			valid: false,
			error: `File type ${mimeType} is not allowed. Only JPEG and PNG files are supported.`,
		};
	}
	return { valid: true };
}

export function validateFileSize(size: number): {
	valid: boolean;
	error?: string;
} {
	if (size > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `File size ${Math.round(size / 1024 / 1024)}MB exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
		};
	}
	return { valid: true };
}

// Type exports
export type PhotoMetadata = z.infer<typeof photoMetadataSchema>;
export type FileValidation = z.infer<typeof fileValidationSchema>;
export type PhotoSubmission = z.infer<typeof photoSubmissionSchema>;
export type PhotoUpdate = z.infer<typeof photoUpdateSchema>;
export type GetUserSubmissions = z.infer<typeof getUserSubmissionsSchema>;
export type GetPhotosByCategory = z.infer<typeof getPhotosByCategorySchema>;
export type GetPhotosByCompetition = z.infer<
	typeof getPhotosByCompetitionSchema
>;
export type GetSignedUrl = z.infer<typeof getSignedUrlSchema>;
export type ConfirmUpload = z.infer<typeof confirmUploadSchema>;
