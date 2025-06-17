import { z } from "zod";

export const userRoleSchema = z.enum(["user", "admin", "superadmin"]);

export const competitionStatusSchema = z.enum([
	"active",
	"inactive",
	"draft",
	"completed",
]);

export const photoStatusSchema = z.enum([
	"pending",
	"approved",
	"rejected",
	"flagged",
]);

export const reportReasonSchema = z.enum([
	"inappropriate",
	"copyright",
	"off_topic",
	"poor_quality",
	"spam",
	"other",
]);

export const reportStatusSchema = z.enum([
	"pending",
	"reviewed",
	"resolved",
	"dismissed",
]);

export const winnerPlaceSchema = z.enum(["first", "second", "third"]);

export const createCompetitionSchema = z
	.object({
		title: z.string().min(3).max(100),
		description: z.string().min(10).max(2000),
		startDate: z.date().optional(),
		endDate: z.date().optional(),
		status: competitionStatusSchema.default("draft"),
	})
	.refine(
		(data) => {
			if (data.startDate && data.endDate) {
				return data.endDate > data.startDate;
			}
			return true;
		},
		{
			message: "End date must be after start date",
			path: ["endDate"],
		},
	);

export const createCategorySchema = z.object({
	name: z.string().min(2).max(50),
	competitionId: z.string().uuid(),
	maxPhotosPerUser: z.number().min(1).max(20).default(5),
});

export const createPhotoSchema = z.object({
	title: z.string().min(3).max(100),
	description: z.string().min(20).max(500),
	dateTaken: z.date(),
	location: z.string().min(2).max(100),
	cameraInfo: z.string().max(200).optional(),
	settings: z.string().max(200).optional(),
	categoryId: z.string().uuid(),
});

export const createVoteSchema = z.object({
	photoId: z.string().uuid(),
});

export const createReportSchema = z.object({
	photoId: z.string().uuid(),
	reason: reportReasonSchema,
	description: z.string().max(500).optional(),
});

export const createWinnerSchema = z.object({
	photoId: z.string().uuid(),
	categoryId: z.string().uuid(),
	place: winnerPlaceSchema,
});

// User management schemas
export const userSearchSchema = z.object({
	search: z.string().optional(),
	role: userRoleSchema.optional(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

export const userUpdateSchema = z.object({
	id: z.string(),
	data: z.object({
		name: z.string().min(1).max(100).optional(),
		email: z.string().email().optional(),
		roles: userRoleSchema.optional(),
		emailVerified: z.boolean().optional(),
	}),
});

export const createUserSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	email: z.string().email("Invalid email address"),
	roles: userRoleSchema.default("user"),
	emailVerified: z.boolean().default(false),
});
