# Task 1: Database Schema

## Overview
Create the complete database schema for the photo competition platform using Drizzle ORM with proper relationships, constraints, and indexes.

## Goals
- Define all competition-related tables in Drizzle schema
- Create database migrations
- Set up proper relationships and constraints
- Add necessary indexes for performance

## Database Schema Definition

### File: `api/database/schema.ts`

```typescript
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// Extend existing user table with roles
export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
	name: text("name"),
	image: text("image"),
	role: text("role", { enum: ["user", "admin", "superadmin"] }).notNull().default("user"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Competitions table
export const competitions = sqliteTable("competitions", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	startDate: integer("start_date", { mode: "timestamp" }),
	endDate: integer("end_date", { mode: "timestamp" }),
	status: text("status", { enum: ["active", "inactive", "draft", "completed"] }).notNull().default("draft"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Categories table
export const categories = sqliteTable("categories", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	competitionId: text("competition_id").notNull().references(() => competitions.id, { onDelete: "cascade" }),
	maxPhotosPerUser: integer("max_photos_per_user").notNull().default(5),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
	uniqueNamePerCompetition: uniqueIndex("unique_category_name_per_competition").on(table.competitionId, table.name),
}));

// Photos table
export const photos = sqliteTable("photos", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	description: text("description").notNull(),
	dateTaken: integer("date_taken", { mode: "timestamp" }).notNull(),
	location: text("location").notNull(),
	cameraInfo: text("camera_info"),
	settings: text("settings"),
	filePath: text("file_path").notNull(),
	fileName: text("file_name").notNull(),
	fileSize: integer("file_size").notNull(),
	width: integer("width").notNull(),
	height: integer("height").notNull(),
	status: text("status", { enum: ["pending", "approved", "rejected", "flagged"] }).notNull().default("pending"),
	moderatedBy: text("moderated_by").references(() => users.id),
	moderatedAt: integer("moderated_at", { mode: "timestamp" }),
	rejectionReason: text("rejection_reason"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Votes table
export const votes = sqliteTable("votes", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	photoId: text("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
	uniqueVotePerUser: uniqueIndex("unique_vote_per_user").on(table.userId, table.photoId),
}));

// Reports table
export const reports = sqliteTable("reports", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	photoId: text("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
	reason: text("reason", { 
		enum: ["inappropriate", "copyright", "off_topic", "poor_quality", "spam", "other"] 
	}).notNull(),
	description: text("description"),
	status: text("status", { enum: ["pending", "reviewed", "resolved", "dismissed"] }).notNull().default("pending"),
	reviewedBy: text("reviewed_by").references(() => users.id),
	reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
	adminNotes: text("admin_notes"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// Winners table
export const winners = sqliteTable("winners", {
	id: text("id").primaryKey(),
	photoId: text("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
	categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
	place: text("place", { enum: ["first", "second", "third"] }).notNull(),
	selectedBy: text("selected_by").notNull().references(() => users.id),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
	uniquePlacePerCategory: uniqueIndex("unique_place_per_category").on(table.categoryId, table.place),
}));

// Relations
export const competitionsRelations = relations(competitions, ({ many }) => ({
	categories: many(categories),
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
	user: one(users, {
		fields: [photos.userId],
		references: [users.id],
	}),
	category: one(categories, {
		fields: [photos.categoryId],
		references: [categories.id],
	}),
	moderatedByUser: one(users, {
		fields: [photos.moderatedBy],
		references: [users.id],
	}),
	votes: many(votes),
	reports: many(reports),
	winners: many(winners),
}));

export const votesRelations = relations(votes, ({ one }) => ({
	user: one(users, {
		fields: [votes.userId],
		references: [users.id],
	}),
	photo: one(photos, {
		fields: [votes.photoId],
		references: [photos.id],
	}),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
	user: one(users, {
		fields: [reports.userId],
		references: [users.id],
	}),
	photo: one(photos, {
		fields: [reports.photoId],
		references: [photos.id],
	}),
	reviewedByUser: one(users, {
		fields: [reports.reviewedBy],
		references: [users.id],
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
	selectedByUser: one(users, {
		fields: [winners.selectedBy],
		references: [users.id],
	}),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
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
```

## Database Utilities

### File: `api/database/utils.ts`

```typescript
import { eq, sql, and, desc, asc } from "drizzle-orm";
import { db } from "./db";
import { photos, votes, categories, competitions } from "./schema";

// Utility to get photo with vote count
export async function getPhotoWithVoteCount(photoId: string) {
	const result = await db
		.select({
			photo: photos,
			voteCount: sql<number>`cast(count(${votes.id}) as int)`,
		})
		.from(photos)
		.leftJoin(votes, eq(photos.id, votes.photoId))
		.where(eq(photos.id, photoId))
		.groupBy(photos.id)
		.get();

	return result;
}

// Utility to get photos by category with vote counts
export async function getPhotosByCategory(categoryId: string, limit = 20, offset = 0) {
	return await db
		.select({
			photo: photos,
			voteCount: sql<number>`cast(count(${votes.id}) as int)`,
		})
		.from(photos)
		.leftJoin(votes, eq(photos.id, votes.photoId))
		.where(and(eq(photos.categoryId, categoryId), eq(photos.status, "approved")))
		.groupBy(photos.id)
		.orderBy(desc(sql`count(${votes.id})`), desc(photos.createdAt))
		.limit(limit)
		.offset(offset);
}

// Utility to check if user has reached photo limit for category
export async function checkPhotoLimit(userId: string, categoryId: string): Promise<boolean> {
	const category = await db.select().from(categories).where(eq(categories.id, categoryId)).get();
	if (!category) return false;

	const photoCount = await db
		.select({ count: sql<number>`cast(count(*) as int)` })
		.from(photos)
		.where(and(eq(photos.userId, userId), eq(photos.categoryId, categoryId)))
		.get();

	return (photoCount?.count || 0) >= category.maxPhotosPerUser;
}

// Utility to get active competition
export async function getActiveCompetition() {
	return await db
		.select()
		.from(competitions)
		.where(eq(competitions.status, "active"))
		.get();
}
```

## Migration Generation

### Using Drizzle-Kit for Migrations

Instead of manually writing SQL migration files, use drizzle-kit to automatically generate migrations from the schema:

```bash
# Generate and apply migrations locally
bun db:update

# This command does two things:
# 1. bun drizzle-kit generate - generates migration files from schema changes
# 2. wrangler d1 migrations apply app-db --local - applies them to local database
```

### Migration Process

1. **Update Schema**: Modify `api/database/schema.ts` with new table definitions
2. **Generate Migration**: Run `bun drizzle-kit generate` to create migration files
3. **Apply Locally**: Run `wrangler d1 migrations apply app-db --local` to test locally
4. **Apply Remotely**: Run `bun db:apply --remote` to deploy to production

### Migration Files Location

Drizzle-kit will automatically generate migration files in the `migrations/` directory:
- `migrations/0001_create_competitions.sql`
- `migrations/0002_create_categories.sql`
- `migrations/0003_create_photos.sql`
- etc.

### Additional Migration Commands

```bash
# Generate migrations only (without applying)
bun run db:gen

# Apply to remote database (production)
bun run db:apply --remote

# Apply specific migration to local
wrangler d1 migrations apply app-db --local

# Apply specific migration to remote
wrangler d1 migrations apply app-db --remote
```

### Schema Migration Notes

- Drizzle-kit will detect schema changes and generate appropriate SQL
- Foreign key constraints and indexes will be automatically generated
- Enum constraints will be properly handled for SQLite
- The existing `users` table will need special handling for the `role` column addition

## Validation Schemas

### File: `api/database/validations.ts`

```typescript
import { z } from "zod";

export const userRoleSchema = z.enum(["user", "admin", "superadmin"]);

export const competitionStatusSchema = z.enum(["active", "inactive", "draft", "completed"]);

export const photoStatusSchema = z.enum(["pending", "approved", "rejected", "flagged"]);

export const reportReasonSchema = z.enum(["inappropriate", "copyright", "off_topic", "poor_quality", "spam", "other"]);

export const reportStatusSchema = z.enum(["pending", "reviewed", "resolved", "dismissed"]);

export const winnerPlaceSchema = z.enum(["first", "second", "third"]);

export const createCompetitionSchema = z.object({
	title: z.string().min(3).max(100),
	description: z.string().min(10).max(2000),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	status: competitionStatusSchema.default("draft"),
}).refine((data) => {
	if (data.startDate && data.endDate) {
		return data.endDate > data.startDate;
	}
	return true;
}, {
	message: "End date must be after start date",
	path: ["endDate"],
});

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
```

## Database Connection

### File: `api/database/db.ts`

```typescript
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// This will be injected by the Cloudflare Worker context
export function createDb(d1: D1Database) {
	return drizzle(d1, { schema });
}

// Type for the database instance
export type Database = ReturnType<typeof createDb>;
```

## Success Criteria
- [ ] All tables defined in Drizzle schema
- [ ] Relationships and constraints properly configured
- [ ] Unique indexes defined in schema
- [ ] Migration files generated using `bun db:update`
- [ ] Migrations applied successfully to local database
- [ ] Type definitions exported correctly
- [ ] Validation schemas defined
- [ ] Database utilities created
- [ ] Performance indexes included in schema

## Dependencies
- Existing Drizzle ORM setup
- D1 database connection
- Zod for validation

## Estimated Time
**1 day**

## Next Task
Task 2: User Roles Extension - Extend better-auth with role-based access control