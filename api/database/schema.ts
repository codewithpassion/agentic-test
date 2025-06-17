import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	unique,
} from "drizzle-orm/sqlite-core";

// Import the user table from better-auth schema
import { user } from "../../packages/better-auth/db/auth-schema";

// Competitions table
export const competitions = sqliteTable("competitions", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	startDate: integer("start_date", { mode: "timestamp" }),
	endDate: integer("end_date", { mode: "timestamp" }),
	status: text("status", { enum: ["active", "inactive", "draft", "completed"] })
		.notNull()
		.default("draft"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Categories table
export const categories = sqliteTable(
	"categories",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		competitionId: text("competition_id")
			.notNull()
			.references(() => competitions.id, { onDelete: "cascade" }),
		maxPhotosPerUser: integer("max_photos_per_user").notNull().default(5),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(t) => [
		unique("unique_category_name_per_competition").on(t.competitionId, t.name),
	],
);

// Photos table
export const photos = sqliteTable(
	"photos",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		competitionId: text("competition_id")
			.notNull()
			.references(() => competitions.id, { onDelete: "cascade" }),
		categoryId: text("category_id")
			.notNull()
			.references(() => categories.id, { onDelete: "cascade" }),

		// Photo metadata
		title: text("title").notNull(),
		description: text("description").notNull(),
		dateTaken: integer("date_taken", { mode: "timestamp" }),
		location: text("location").notNull(),

		// File information
		filePath: text("file_path").notNull(),
		fileName: text("file_name").notNull(),
		fileSize: integer("file_size").notNull(),
		mimeType: text("mime_type").notNull(),
		width: integer("width").notNull(),
		height: integer("height").notNull(),

		// Camera information (optional)
		cameraMake: text("camera_make"),
		cameraModel: text("camera_model"),
		lens: text("lens"),
		focalLength: text("focal_length"),
		aperture: text("aperture"),
		shutterSpeed: text("shutter_speed"),
		iso: text("iso"),

		// Status and moderation
		status: text("status", {
			enum: ["pending", "approved", "rejected", "deleted"],
		})
			.notNull()
			.default("pending"),
		moderatedBy: text("moderated_by").references(() => user.id),
		moderatedAt: integer("moderated_at", { mode: "timestamp" }),
		rejectionReason: text("rejection_reason"),

		// Timestamps
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(t) => [
		// Indexes for performance
		index("idx_photos_user_id").on(t.userId),
		index("idx_photos_competition_id").on(t.competitionId),
		index("idx_photos_category_id").on(t.categoryId),
		index("idx_photos_status").on(t.status),
		index("idx_photos_created_at").on(t.createdAt),

		// Unique constraint to prevent duplicate submissions
		unique("unique_photo_submission").on(
			t.userId,
			t.competitionId,
			t.categoryId,
			t.title,
		),
	],
);

// Votes table
export const votes = sqliteTable(
	"votes",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		photoId: text("photo_id")
			.notNull()
			.references(() => photos.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(t) => [unique("unique_vote_per_user").on(t.userId, t.photoId)],
);

// Reports table
export const reports = sqliteTable("reports", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	photoId: text("photo_id")
		.notNull()
		.references(() => photos.id, { onDelete: "cascade" }),
	reason: text("reason", {
		enum: [
			"inappropriate",
			"copyright",
			"off_topic",
			"poor_quality",
			"spam",
			"other",
		],
	}).notNull(),
	description: text("description"),
	status: text("status", {
		enum: ["pending", "reviewed", "resolved", "dismissed"],
	})
		.notNull()
		.default("pending"),
	reviewedBy: text("reviewed_by").references(() => user.id),
	reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
	adminNotes: text("admin_notes"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Winners table
export const winners = sqliteTable(
	"winners",
	{
		id: text("id").primaryKey(),
		photoId: text("photo_id")
			.notNull()
			.references(() => photos.id, { onDelete: "cascade" }),
		categoryId: text("category_id")
			.notNull()
			.references(() => categories.id, { onDelete: "cascade" }),
		place: text("place", { enum: ["first", "second", "third"] }).notNull(),
		selectedBy: text("selected_by")
			.notNull()
			.references(() => user.id),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(t) => [unique("unique_place_per_category").on(t.categoryId, t.place)],
);

// Relations
export const competitionsRelations = relations(competitions, ({ many }) => ({
	categories: many(categories),
	photos: many(photos),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	competition: one(competitions, {
		fields: [categories.competitionId],
		references: [competitions.id],
	}),
	photos: many(photos),
	winners: many(winners),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
	user: one(user, {
		fields: [photos.userId],
		references: [user.id],
	}),
	competition: one(competitions, {
		fields: [photos.competitionId],
		references: [competitions.id],
	}),
	category: one(categories, {
		fields: [photos.categoryId],
		references: [categories.id],
	}),
	moderatedByUser: one(user, {
		fields: [photos.moderatedBy],
		references: [user.id],
	}),
	votes: many(votes),
	reports: many(reports),
	winners: many(winners),
}));

export const votesRelations = relations(votes, ({ one }) => ({
	user: one(user, {
		fields: [votes.userId],
		references: [user.id],
	}),
	photo: one(photos, {
		fields: [votes.photoId],
		references: [photos.id],
	}),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
	user: one(user, {
		fields: [reports.userId],
		references: [user.id],
	}),
	photo: one(photos, {
		fields: [reports.photoId],
		references: [photos.id],
	}),
	reviewedByUser: one(user, {
		fields: [reports.reviewedBy],
		references: [user.id],
	}),
}));

export const winnersRelations = relations(winners, ({ one }) => ({
	photo: one(photos, {
		fields: [winners.photoId],
		references: [photos.id],
	}),
	category: one(categories, {
		fields: [winners.categoryId],
		references: [categories.id],
	}),
	selectedByUser: one(user, {
		fields: [winners.selectedBy],
		references: [user.id],
	}),
}));

// User relations
export const userRelations = relations(user, ({ many }) => ({
	photos: many(photos),
	votes: many(votes),
	reports: many(reports),
	moderatedPhotos: many(photos),
	reviewedReports: many(reports),
	selectedWinners: many(winners),
}));

// Re-export user table and types
export { user };
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// Type exports
export type Competition = typeof competitions.$inferSelect;
export type NewCompetition = typeof competitions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Winner = typeof winners.$inferSelect;
export type NewWinner = typeof winners.$inferInsert;

// Photo with relations type for API responses
export type PhotoWithRelations = Photo & {
	user?: {
		id?: string;
		name?: string;
	};
	competition?: {
		id?: string;
		title?: string;
		status?: string;
		endDate?: Date | null;
	};
	category?: {
		id?: string;
		name?: string;
		maxPhotosPerUser?: number;
	};
	moderatedByUser?: {
		id?: string;
		name?: string;
	};
};
