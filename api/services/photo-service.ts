import type { D1Database } from "@cloudflare/workers-types";
import { type SQL, and, asc, count, desc, eq, ne } from "drizzle-orm";
import { createDbWithSchema } from "../database/db";
import { categories, competitions, photos, user } from "../database/schema";
import type { NewPhoto, Photo, PhotoWithRelations } from "../database/schema";
import { generateId } from "../lib/utils";
import { PhotoFileStore } from "./photo-file-store";
import type { PhotoFile } from "./photo-file-store";

export class PhotoService {
	private db: ReturnType<typeof createDbWithSchema>;
	private fileStore: PhotoFileStore;

	constructor(database: D1Database, photoStorage: R2Bucket) {
		this.db = createDbWithSchema(database);
		this.fileStore = new PhotoFileStore(photoStorage);
	}

	/**
	 * Submit a new photo
	 */
	async submitPhoto(
		userId: string,
		photoData: Omit<NewPhoto, "id" | "userId" | "createdAt" | "updatedAt">,
	): Promise<Photo> {
		await this._validateSubmission(
			userId,
			photoData.competitionId,
			photoData.categoryId,
			photoData.title,
		);

		const newPhoto: NewPhoto = {
			id: generateId(),
			userId,
			...photoData,
			status: "pending",
		};

		return this.db.insert(photos).values(newPhoto).returning().get();
	}

	/**
	 * Upload photo file and create database record in a coordinated transaction
	 */
	async uploadPhoto(
		userId: string,
		file: File,
		photoData: Omit<
			NewPhoto,
			| "id"
			| "userId"
			| "createdAt"
			| "updatedAt"
			| "filePath"
			| "fileName"
			| "fileSize"
			| "mimeType"
		>,
	): Promise<Photo> {
		const allowedTypes = ["image/jpeg", "image/png"];
		if (!allowedTypes.includes(file.type)) {
			throw new Error(
				"Invalid file type. Only JPEG and PNG files are allowed.",
			);
		}
		if (file.size > 10 * 1024 * 1024) {
			// 10MB
			throw new Error("File too large. Maximum size is 10MB.");
		}

		await this._validateSubmission(
			userId,
			photoData.competitionId,
			photoData.categoryId,
			photoData.title,
		);

		const photoId = generateId();
		let uploadedFile: PhotoFile | undefined;

		try {
			uploadedFile = await this.fileStore.create({
				id: photoId,
				name: file.name,
				type: file.type,
				content: file,
				competitionId: photoData.competitionId,
				categoryId: photoData.categoryId,
				userId,
			});

			const newPhoto: NewPhoto = {
				id: photoId,
				userId,
				...photoData,
				filePath: uploadedFile.key || "",
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type as "image/jpeg" | "image/png",
				status: "pending",
			};

			return await this.db.insert(photos).values(newPhoto).returning().get();
		} catch (error) {
			console.error("Failed during photo upload process:", error);
			// Cleanup R2 file if it was created before a DB error
			if (uploadedFile) {
				try {
					await this.fileStore.delete(uploadedFile);
				} catch (cleanupError) {
					console.error(
						"Failed to cleanup uploaded file after error:",
						cleanupError,
					);
				}
			}
			throw new Error("Failed to upload photo. The operation was rolled back.");
		}
	}

	/**
	 * Update photo metadata
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
		const existingPhoto = await this.getPhotoById(photoId);
		if (!existingPhoto) throw new Error("Photo not found");
		if (existingPhoto.userId !== userId)
			throw new Error("You can only update your own photos");
		if (existingPhoto.status === "deleted")
			throw new Error("Cannot update deleted photo");

		if (updates.title && updates.title !== existingPhoto.title) {
			await this._validateSubmission(
				userId,
				existingPhoto.competitionId,
				existingPhoto.categoryId,
				updates.title,
				photoId, // Exclude current photo from duplicate check
			);
		}

		return this.db
			.update(photos)
			.set({ ...updates, updatedAt: new Date() })
			.where(eq(photos.id, photoId))
			.returning()
			.get();
	}

	/**
	 * Delete user's photo (soft delete)
	 */
	async deletePhoto(photoId: string, userId: string): Promise<void> {
		const result = await this.db
			.update(photos)
			.set({ status: "deleted", updatedAt: new Date() })
			.where(and(eq(photos.id, photoId), eq(photos.userId, userId)))
			.run();

		if (result.meta.changes === 0) {
			// Check if photo exists to give a more specific error
			const photoExists = await this.getPhotoById(photoId);
			if (!photoExists) throw new Error("Photo not found");
			throw new Error("You can only delete your own photos");
		}
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
	 * Get photo by ID with relations
	 */
	async getPhotoByIdWithRelations(
		photoId: string,
	): Promise<PhotoWithRelations | null> {
		const photo = await this.db.query.photos.findFirst({
			where: eq(photos.id, photoId),
			with: { user: true, competition: true, category: true },
		});
		return photo || null;
	}

	/**
	 * A generic, type-safe method to find photos with relations and total count.
	 */
	private async _findPhotosWithCount(
		// Allow the where clause to be undefined
		where: SQL | undefined,
		options: {
			with: {
				user?: true;
				competition?: true;
				category?: true;
				moderatedByUser?: true;
			};
			limit?: number;
			offset?: number;
			orderBy?: SQL | SQL[];
		},
	): Promise<{ photos: PhotoWithRelations[]; total: number }> {
		const dataQuery = this.db.query.photos.findMany({
			where, // Drizzle handles an undefined 'where' gracefully
			with: options.with,
			limit: options.limit,
			offset: options.offset,
			orderBy: options.orderBy,
		});

		const countQuery = this.db
			.select({ total: count() })
			.from(photos)
			.where(where); // Drizzle handles an undefined 'where' gracefully

		const [photoList, [{ total }]] = await Promise.all([dataQuery, countQuery]);

		return { photos: photoList as PhotoWithRelations[], total };
	}

	/**
	 * Get user's submissions with filtering
	 */
	async getUserSubmissions(
		userId: string,
		options: {
			competitionId?: string;
			categoryId?: string;
			status?: Photo["status"];
			limit?: number;
			offset?: number;
		} = {},
	): Promise<{ photos: PhotoWithRelations[]; total: number }> {
		const {
			competitionId,
			categoryId,
			status,
			limit = 20,
			offset = 0,
		} = options;
		const conditions = [eq(photos.userId, userId)];
		if (competitionId) conditions.push(eq(photos.competitionId, competitionId));
		if (categoryId) conditions.push(eq(photos.categoryId, categoryId));
		if (status) conditions.push(eq(photos.status, status));

		return this._findPhotosWithCount(and(...conditions), {
			with: { user: true, competition: true, category: true },
			limit,
			offset,
			orderBy: desc(photos.createdAt),
		});
	}

	/**
	 * Get photos by category (public view - only approved)
	 */
	async getPhotosByCategory(
		categoryId: string,
		options: { limit?: number; offset?: number } = {},
	): Promise<{ photos: PhotoWithRelations[]; total: number }> {
		const { limit = 20, offset = 0 } = options;
		const whereClause = and(
			eq(photos.categoryId, categoryId),
			eq(photos.status, "approved"),
		);
		return this._findPhotosWithCount(whereClause, {
			with: { user: true, competition: true, category: true },
			limit,
			offset,
			orderBy: desc(photos.createdAt),
		});
	}

	/**
	 * Get photos by competition (public view - only approved)
	 */
	async getPhotosByCompetition(
		competitionId: string,
		options: { categoryId?: string; limit?: number; offset?: number } = {},
	): Promise<{ photos: PhotoWithRelations[]; total: number }> {
		const { categoryId, limit = 20, offset = 0 } = options;
		const conditions = [
			eq(photos.competitionId, competitionId),
			eq(photos.status, "approved"),
		];
		if (categoryId) conditions.push(eq(photos.categoryId, categoryId));

		return this._findPhotosWithCount(and(...conditions), {
			with: { user: true, competition: true, category: true },
			limit,
			offset,
			orderBy: desc(photos.createdAt),
		});
	}

	/**
	 * Admin: Get photos needing moderation
	 */
	async getPhotosForModeration(
		options: { limit?: number; offset?: number } = {},
	): Promise<{ photos: PhotoWithRelations[]; total: number }> {
		return this._findPhotosWithCount(eq(photos.status, "pending"), {
			with: {
				user: true,
				competition: true,
				category: true,
				moderatedByUser: true,
			},
			limit: options.limit ?? 20,
			offset: options.offset ?? 0,
			orderBy: asc(photos.createdAt),
		});
	}

	/**
	 * Admin: Get all photos for administration
	 */
	async getAllPhotosForAdmin(
		options: {
			limit?: number;
			offset?: number;
			status?: "all" | "pending" | "approved" | "rejected";
		} = {},
	): Promise<{ photos: PhotoWithRelations[]; total: number }> {
		const { status = "all", limit = 50, offset = 0 } = options;
		const whereClause =
			status === "all"
				? ne(photos.status, "deleted")
				: eq(photos.status, status);

		return this._findPhotosWithCount(whereClause, {
			with: {
				user: true,
				competition: true,
				category: true,
				moderatedByUser: true,
			},
			limit,
			offset,
			orderBy: desc(photos.createdAt),
		});
	}

	/**
	 * Check submission limits and for duplicate titles
	 */
	private async _validateSubmission(
		userId: string,
		competitionId: string,
		categoryId: string,
		title: string,
		excludePhotoId?: string,
	): Promise<void> {
		const category = await this.db.query.categories.findFirst({
			where: eq(categories.id, categoryId),
			columns: { maxPhotosPerUser: true },
		});

		if (!category) throw new Error("Category not found");

		const commonConditions = [
			eq(photos.userId, userId),
			eq(photos.competitionId, competitionId),
			eq(photos.categoryId, categoryId),
			ne(photos.status, "deleted"),
		];

		// 1. Check submission count
		const [{ count: existingCount }] = await this.db
			.select({ count: count() })
			.from(photos)
			.where(and(...commonConditions));

		if (existingCount >= category.maxPhotosPerUser) {
			throw new Error(
				`Maximum of ${category.maxPhotosPerUser} photos allowed in this category.`,
			);
		}

		// 2. Check for duplicate title
		const duplicateConditions = [...commonConditions, eq(photos.title, title)];
		if (excludePhotoId) {
			duplicateConditions.push(ne(photos.id, excludePhotoId));
		}

		const duplicatePhoto = await this.db.query.photos.findFirst({
			where: and(...duplicateConditions),
			columns: { id: true },
		});

		if (duplicatePhoto) {
			throw new Error(
				"A photo with this title already exists in this category",
			);
		}
	}

	/**
	 * Admin: Moderate photo (approve/reject)
	 */
	async moderatePhoto(
		photoId: string,
		moderatorId: string,
		action: "approve" | "reject" | "reset",
		reason?: string,
	): Promise<Photo> {
		const photo = await this.getPhotoById(photoId);
		if (!photo) throw new Error("Photo not found");

		// By adding `as const`, TypeScript infers the values as "approved", "rejected", etc., not just `string`.
		const statusMap = {
			approve: "approved",
			reject: "rejected",
			reset: "pending",
		} as const;

		// The check for a valid action can now be more type-safe
		if (!(action in statusMap)) {
			// This case should now be impossible if the `action` type is correct,
			// but it's good for robustness.
			throw new Error("Invalid action");
		}

		const newStatus = statusMap[action];

		return this.db
			.update(photos)
			.set({
				status: newStatus, // This is now correctly typed and passes the check
				moderatedBy: action === "reset" ? null : moderatorId,
				moderatedAt: action === "reset" ? null : new Date(),
				rejectionReason: action === "reject" ? reason : null,
				updatedAt: new Date(),
			})
			.where(eq(photos.id, photoId))
			.returning()
			.get();
	}

	/**
	 * Submit multiple photos in a batch using a transaction
	 */
	async submitPhotoBatch(
		userId: string,
		batchData: {
			competitionId: string;
			photos: Array<
				Omit<
					NewPhoto,
					"id" | "userId" | "createdAt" | "updatedAt" | "competitionId"
				>
			>;
		},
	): Promise<{
		success: Photo[];
		errors: Array<{ index: number; error: string; photo?: unknown }>;
	}> {
		const success: Photo[] = [];
		const errors: Array<{ index: number; error: string; photo?: unknown }> = [];

		// Note: Drizzle's D1 driver doesn't support transactions yet.
		// The following is the ideal implementation. If your driver supports it, use it.
		// If not, the original loop-based approach is a fallback.
		// For now, we simulate it with a loop.

		for (let i = 0; i < batchData.photos.length; i++) {
			const photoData = batchData.photos[i];
			try {
				const submittedPhoto = await this.submitPhoto(userId, {
					...photoData,
					competitionId: batchData.competitionId,
				});
				success.push(submittedPhoto);
			} catch (error) {
				errors.push({
					index: i,
					error: error instanceof Error ? error.message : "Unknown error",
					photo: photoData,
				});
			}
		}

		return { success, errors };
	}
}
