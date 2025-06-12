import { and, desc, eq, sql } from "drizzle-orm";
import type { createDb, createDbWithSchema } from "./db";
import { categories, competitions, photos, votes } from "./schema";

// Type for database instance (can be with or without schema)
type DbInstance =
	| ReturnType<typeof createDb>
	| ReturnType<typeof createDbWithSchema>;

// Utility to get photo with vote count
export async function getPhotoWithVoteCount(db: DbInstance, photoId: string) {
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
export async function getPhotosByCategory(
	db: DbInstance,
	categoryId: string,
	limit = 20,
	offset = 0,
) {
	return await db
		.select({
			photo: photos,
			voteCount: sql<number>`cast(count(${votes.id}) as int)`,
		})
		.from(photos)
		.leftJoin(votes, eq(photos.id, votes.photoId))
		.where(
			and(eq(photos.categoryId, categoryId), eq(photos.status, "approved")),
		)
		.groupBy(photos.id)
		.orderBy(desc(sql`count(${votes.id})`), desc(photos.createdAt))
		.limit(limit)
		.offset(offset);
}

// Utility to check if user has reached photo limit for category
export async function checkPhotoLimit(
	db: DbInstance,
	userId: string,
	categoryId: string,
): Promise<boolean> {
	const category = await db
		.select()
		.from(categories)
		.where(eq(categories.id, categoryId))
		.get();
	if (!category) return false;

	const photoCount = await db
		.select({ count: sql<number>`cast(count(*) as int)` })
		.from(photos)
		.where(and(eq(photos.userId, userId), eq(photos.categoryId, categoryId)))
		.get();

	return (photoCount?.count || 0) >= category.maxPhotosPerUser;
}

// Utility to get active competition
export async function getActiveCompetition(db: DbInstance) {
	return await db
		.select()
		.from(competitions)
		.where(eq(competitions.status, "active"))
		.get();
}

// Utility to get user vote count for a photo
export async function getUserVoteForPhoto(
	db: DbInstance,
	userId: string,
	photoId: string,
) {
	return await db
		.select()
		.from(votes)
		.where(and(eq(votes.userId, userId), eq(votes.photoId, photoId)))
		.get();
}

// Utility to get total vote count for a photo
export async function getPhotoVoteCount(db: DbInstance, photoId: string) {
	const result = await db
		.select({ count: sql<number>`cast(count(*) as int)` })
		.from(votes)
		.where(eq(votes.photoId, photoId))
		.get();

	return result?.count || 0;
}
