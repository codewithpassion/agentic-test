import type { D1Database } from "@cloudflare/workers-types";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { createDb } from "../database/db";
import { categories, competitions, photos } from "../database/schema";
import type { NewPhoto, Photo } from "../database/schema";
import { generateId } from "../lib/utils";

export class PhotoService {
	private db: ReturnType<typeof createDb>;

	constructor(database: D1Database) {
		this.db = createDb(database);
	}

	/**
	 * Submit a new photo
	 */
	async submitPhoto(
		userId: string,
		photoData: Omit<NewPhoto, "id" | "userId" | "createdAt" | "updatedAt">,
	): Promise<Photo> {
		// Check submission limits for this category
		await this.checkSubmissionLimits(
			userId,
			photoData.competitionId,
			photoData.categoryId,
		);

		// Check for duplicate submissions (same title in same category)
		const existingPhoto = await this.db
			.select()
			.from(photos)
			.where(
				and(
					eq(photos.userId, userId),
					eq(photos.competitionId, photoData.competitionId),
					eq(photos.categoryId, photoData.categoryId),
					eq(photos.title, photoData.title),
					sql`${photos.status} != 'deleted'`,
				),
			)
			.get();

		if (existingPhoto) {
			throw new Error(
				"A photo with this title already exists in this category",
			);
		}

		const photoId = generateId();
		const newPhoto: NewPhoto = {
			id: photoId,
			userId,
			...photoData,
			status: "pending",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await this.db.insert(photos).values(newPhoto);

		const photo = await this.getPhotoById(photoId);
		if (!photo) {
			throw new Error("Failed to create photo");
		}

		return photo;
	}

	/**
	 * Update photo metadata (only title, description, etc. - not file info)
	 */
	async updatePhoto(
		photoId: string,
		userId: string,
		updates: Partial<
			Pick<
				Photo,
				| "title"
				| "description"
				| "dateTaken"
				| "location"
				| "cameraMake"
				| "cameraModel"
				| "lens"
				| "focalLength"
				| "aperture"
				| "shutterSpeed"
				| "iso"
			>
		>,
	): Promise<Photo> {
		// Verify ownership
		const existingPhoto = await this.getPhotoById(photoId);
		if (!existingPhoto) {
			throw new Error("Photo not found");
		}
		if (existingPhoto.userId !== userId) {
			throw new Error("You can only update your own photos");
		}
		if (existingPhoto.status === "deleted") {
			throw new Error("Cannot update deleted photo");
		}

		// Check for duplicate title if title is being updated
		if (updates.title && updates.title !== existingPhoto.title) {
			const duplicatePhoto = await this.db
				.select()
				.from(photos)
				.where(
					and(
						eq(photos.userId, userId),
						eq(photos.competitionId, existingPhoto.competitionId),
						eq(photos.categoryId, existingPhoto.categoryId),
						eq(photos.title, updates.title),
						sql`${photos.status} != 'deleted'`,
					),
				)
				.get();

			if (duplicatePhoto) {
				throw new Error(
					"A photo with this title already exists in this category",
				);
			}
		}

		await this.db
			.update(photos)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(photos.id, photoId));

		const updatedPhoto = await this.getPhotoById(photoId);
		if (!updatedPhoto) {
			throw new Error("Failed to update photo");
		}

		return updatedPhoto;
	}

	/**
	 * Delete user's photo (soft delete)
	 */
	async deletePhoto(photoId: string, userId: string): Promise<void> {
		const photo = await this.getPhotoById(photoId);
		if (!photo) {
			throw new Error("Photo not found");
		}
		if (photo.userId !== userId) {
			throw new Error("You can only delete your own photos");
		}

		await this.db
			.update(photos)
			.set({
				status: "deleted",
				updatedAt: new Date(),
			})
			.where(eq(photos.id, photoId));
	}

	/**
	 * Get photo by ID
	 */
	async getPhotoById(photoId: string): Promise<Photo | null> {
		const photo = await this.db
			.select()
			.from(photos)
			.where(eq(photos.id, photoId))
			.get();

		return photo || null;
	}

	/**
	 * Get user's submissions with filtering
	 */
	async getUserSubmissions(
		userId: string,
		options: {
			competitionId?: string;
			categoryId?: string;
			status?: "pending" | "approved" | "rejected" | "deleted";
			limit?: number;
			offset?: number;
		} = {},
	): Promise<{ photos: Photo[]; total: number }> {
		const {
			competitionId,
			categoryId,
			status,
			limit = 20,
			offset = 0,
		} = options;

		// Build where conditions
		const conditions = [eq(photos.userId, userId)];
		if (competitionId) conditions.push(eq(photos.competitionId, competitionId));
		if (categoryId) conditions.push(eq(photos.categoryId, categoryId));
		if (status) conditions.push(eq(photos.status, status));

		const whereClause = and(...conditions);

		// Get total count
		const [{ total }] = await this.db
			.select({ total: count() })
			.from(photos)
			.where(whereClause);

		// Get photos
		const photoList = await this.db
			.select()
			.from(photos)
			.where(whereClause)
			.orderBy(desc(photos.createdAt))
			.limit(limit)
			.offset(offset);

		return { photos: photoList, total };
	}

	/**
	 * Get photos by category (public view - only approved)
	 */
	async getPhotosByCategory(
		categoryId: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<{ photos: Photo[]; total: number }> {
		const { limit = 20, offset = 0 } = options;

		const whereClause = and(
			eq(photos.categoryId, categoryId),
			eq(photos.status, "approved"),
		);

		// Get total count
		const [{ total }] = await this.db
			.select({ total: count() })
			.from(photos)
			.where(whereClause);

		// Get photos
		const photoList = await this.db
			.select()
			.from(photos)
			.where(whereClause)
			.orderBy(desc(photos.createdAt))
			.limit(limit)
			.offset(offset);

		return { photos: photoList, total };
	}

	/**
	 * Get photos by competition with optional category filter
	 */
	async getPhotosByCompetition(
		competitionId: string,
		options: { categoryId?: string; limit?: number; offset?: number } = {},
	): Promise<{ photos: Photo[]; total: number }> {
		const { categoryId, limit = 20, offset = 0 } = options;

		const conditions = [
			eq(photos.competitionId, competitionId),
			eq(photos.status, "approved"),
		];
		if (categoryId) conditions.push(eq(photos.categoryId, categoryId));

		const whereClause = and(...conditions);

		// Get total count
		const [{ total }] = await this.db
			.select({ total: count() })
			.from(photos)
			.where(whereClause);

		// Get photos
		const photoList = await this.db
			.select()
			.from(photos)
			.where(whereClause)
			.orderBy(desc(photos.createdAt))
			.limit(limit)
			.offset(offset);

		return { photos: photoList, total };
	}

	/**
	 * Check submission limits for a user in a category
	 */
	private async checkSubmissionLimits(
		userId: string,
		competitionId: string,
		categoryId: string,
	): Promise<void> {
		// Get category with max photos per user
		const category = await this.db
			.select()
			.from(categories)
			.where(eq(categories.id, categoryId))
			.get();

		if (!category) {
			throw new Error("Category not found");
		}

		// Count existing submissions (non-deleted)
		const [{ count: existingCount }] = await this.db
			.select({ count: count() })
			.from(photos)
			.where(
				and(
					eq(photos.userId, userId),
					eq(photos.competitionId, competitionId),
					eq(photos.categoryId, categoryId),
					sql`${photos.status} != 'deleted'`,
				),
			);

		if (existingCount >= category.maxPhotosPerUser) {
			throw new Error(
				`Maximum ${category.maxPhotosPerUser} photos allowed per category. You have already submitted ${existingCount} photos.`,
			);
		}
	}

	/**
	 * Admin: Moderate photo (approve/reject)
	 */
	async moderatePhoto(
		photoId: string,
		moderatorId: string,
		action: "approve" | "reject",
		reason?: string,
	): Promise<Photo> {
		const photo = await this.getPhotoById(photoId);
		if (!photo) {
			throw new Error("Photo not found");
		}

		if (photo.status !== "pending") {
			throw new Error("Photo has already been moderated");
		}

		const newStatus = action === "approve" ? "approved" : "rejected";

		await this.db
			.update(photos)
			.set({
				status: newStatus,
				moderatedBy: moderatorId,
				moderatedAt: new Date(),
				rejectionReason: action === "reject" ? reason : null,
				updatedAt: new Date(),
			})
			.where(eq(photos.id, photoId));

		const updatedPhoto = await this.getPhotoById(photoId);
		if (!updatedPhoto) {
			throw new Error("Failed to moderate photo");
		}

		return updatedPhoto;
	}

	/**
	 * Admin: Get photos needing moderation
	 */
	async getPhotosForModeration(
		options: { limit?: number; offset?: number } = {},
	): Promise<{ photos: Photo[]; total: number }> {
		const { limit = 20, offset = 0 } = options;

		const whereClause = eq(photos.status, "pending");

		// Get total count
		const [{ total }] = await this.db
			.select({ total: count() })
			.from(photos)
			.where(whereClause);

		// Get photos
		const photoList = await this.db
			.select()
			.from(photos)
			.where(whereClause)
			.orderBy(asc(photos.createdAt)) // Oldest first for moderation
			.limit(limit)
			.offset(offset);

		return { photos: photoList, total };
	}
}
