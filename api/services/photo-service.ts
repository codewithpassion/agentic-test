import type { D1Database } from "@cloudflare/workers-types";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { createDb } from "../database/db";
import { categories, competitions, photos, user } from "../database/schema";
import type { NewPhoto, Photo, PhotoWithRelations } from "../database/schema";
import { generateId } from "../lib/utils";
import { PhotoFileStore } from "./photo-file-store";
import type { PhotoFile } from "./photo-file-store";

// Common field selections and transformations
const PHOTO_FIELDS = {
	id: photos.id,
	userId: photos.userId,
	competitionId: photos.competitionId,
	categoryId: photos.categoryId,
	title: photos.title,
	description: photos.description,
	filePath: photos.filePath,
	fileName: photos.fileName,
	fileSize: photos.fileSize,
	mimeType: photos.mimeType,
	width: photos.width,
	height: photos.height,
	status: photos.status,
	dateTaken: photos.dateTaken,
	location: photos.location,
	cameraMake: photos.cameraMake,
	cameraModel: photos.cameraModel,
	lens: photos.lens,
	focalLength: photos.focalLength,
	aperture: photos.aperture,
	shutterSpeed: photos.shutterSpeed,
	iso: photos.iso,
	createdAt: photos.createdAt,
	updatedAt: photos.updatedAt,
	moderatedBy: photos.moderatedBy,
	moderatedAt: photos.moderatedAt,
	rejectionReason: photos.rejectionReason,
} as const;

const USER_FIELDS = {
	userName: user.name,
	userId_rel: user.id,
} as const;

const COMPETITION_FIELDS = {
	competitionTitle: competitions.title,
	competitionStatus: competitions.status,
	competitionEndDate: competitions.endDate,
} as const;

const CATEGORY_FIELDS = {
	categoryName: categories.name,
	categoryMaxPhotosPerUser: categories.maxPhotosPerUser,
} as const;

// Common join patterns
// biome-ignore lint/suspicious/noExplicitAny: Drizzle query builder type is complex and varies
const addPhotoJoins = (query: any) => {
	return query
		.leftJoin(user, eq(user.id, photos.userId))
		.leftJoin(competitions, eq(competitions.id, photos.competitionId))
		.leftJoin(categories, eq(categories.id, photos.categoryId));
};

// Inner joins for cases where competition/category must exist (user submissions)
// biome-ignore lint/suspicious/noExplicitAny: Drizzle query builder type is complex and varies
const addPhotoJoinsRequired = (query: any) => {
	return query
		.leftJoin(user, eq(user.id, photos.userId))
		.innerJoin(competitions, eq(competitions.id, photos.competitionId))
		.innerJoin(categories, eq(categories.id, photos.categoryId));
};

// Transformation utilities
// biome-ignore lint/suspicious/noExplicitAny: Database row type varies across different queries
const transformToPhotoWithRelations = (row: any): PhotoWithRelations => ({
	id: row.id,
	userId: row.userId,
	competitionId: row.competitionId,
	categoryId: row.categoryId,
	title: row.title,
	description: row.description,
	filePath: row.filePath,
	fileName: row.fileName,
	fileSize: row.fileSize,
	mimeType: row.mimeType,
	width: row.width,
	height: row.height,
	status: row.status,
	dateTaken: row.dateTaken,
	location: row.location,
	cameraMake: row.cameraMake,
	cameraModel: row.cameraModel,
	lens: row.lens,
	focalLength: row.focalLength,
	aperture: row.aperture,
	shutterSpeed: row.shutterSpeed,
	iso: row.iso,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
	moderatedBy: row.moderatedBy,
	moderatedAt: row.moderatedAt,
	rejectionReason: row.rejectionReason,
	user: row.userName
		? {
				id: row.userId_rel,
				name: row.userName,
			}
		: undefined,
	competition: row.competitionTitle
		? {
				id: row.competitionId,
				title: row.competitionTitle,
				status: row.competitionStatus,
				endDate: row.competitionEndDate,
			}
		: undefined,
	category: row.categoryName
		? {
				id: row.categoryId,
				name: row.categoryName,
				maxPhotosPerUser: row.categoryMaxPhotosPerUser,
			}
		: undefined,
});

// Transformation for guaranteed relations (inner joins)
const transformToPhotoWithRequiredRelations = (
	// biome-ignore lint/suspicious/noExplicitAny: Database row type varies across different queries
	row: any,
): PhotoWithRelations => ({
	id: row.id,
	userId: row.userId,
	competitionId: row.competitionId,
	categoryId: row.categoryId,
	title: row.title,
	description: row.description,
	filePath: row.filePath,
	fileName: row.fileName,
	fileSize: row.fileSize,
	mimeType: row.mimeType,
	width: row.width,
	height: row.height,
	status: row.status,
	dateTaken: row.dateTaken,
	location: row.location,
	cameraMake: row.cameraMake,
	cameraModel: row.cameraModel,
	lens: row.lens,
	focalLength: row.focalLength,
	aperture: row.aperture,
	shutterSpeed: row.shutterSpeed,
	iso: row.iso,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
	moderatedBy: row.moderatedBy,
	moderatedAt: row.moderatedAt,
	rejectionReason: row.rejectionReason,
	user: row.userName
		? {
				id: row.userId_rel,
				name: row.userName,
			}
		: undefined,
	// These are guaranteed to exist due to inner joins
	competition: {
		id: row.competitionId,
		title: row.competitionTitle,
		status: row.competitionStatus,
		endDate: row.competitionEndDate,
	},
	category: {
		id: row.categoryId,
		name: row.categoryName,
		maxPhotosPerUser: row.categoryMaxPhotosPerUser,
	},
});

const ALL_FIELDS_WITH_RELATIONS = {
	...PHOTO_FIELDS,
	...USER_FIELDS,
	...COMPETITION_FIELDS,
	...CATEGORY_FIELDS,
};

export class PhotoService {
	private db: ReturnType<typeof createDb>;
	private fileStore: PhotoFileStore;

	constructor(database: D1Database, photoStorage: R2Bucket) {
		this.db = createDb(database);
		this.fileStore = new PhotoFileStore(photoStorage);
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
		// Validate file type
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
		if (!allowedTypes.includes(file.type)) {
			throw new Error(
				"Invalid file type. Only JPEG and PNG files are allowed.",
			);
		}

		// Validate file size (10MB max)
		const maxSize = 10 * 1024 * 1024;
		if (file.size > maxSize) {
			throw new Error("File too large. Maximum size is 10MB.");
		}

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

		// Upload file to R2 storage
		let uploadedFile: PhotoFile;
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
		} catch (error) {
			console.error("Failed to upload file to R2:", error);
			throw new Error("Failed to upload file to storage");
		}

		// Create database record
		const newPhoto: NewPhoto = {
			id: photoId,
			userId,
			...photoData,
			filePath: uploadedFile.key || "",
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type as "image/jpeg" | "image/png",
			status: "pending",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		try {
			await this.db.insert(photos).values(newPhoto);

			const photo = await this.getPhotoById(photoId);
			if (!photo) {
				// If database insert failed, clean up the uploaded file
				await this.fileStore.delete(uploadedFile);
				throw new Error("Failed to create photo record");
			}

			return photo;
		} catch (error) {
			console.error(
				`Database insert failed. UserId: ${userId}, competitionid: ${photoData.competitionId}, category: ${photoData.categoryId}, title: ${photoData.title}`,
				error,
			);
			// If database operation failed, clean up the uploaded file
			try {
				await this.fileStore.delete(uploadedFile);
			} catch (cleanupError) {
				console.error(
					"Failed to cleanup uploaded file after database error:",
					cleanupError,
				);
			}
			throw error;
		}
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
	 * Get photo by ID with relations (guarantees competition/category exist)
	 */
	async getPhotoByIdWithRelations(
		photoId: string,
	): Promise<PhotoWithRelations | null> {
		const result = await addPhotoJoinsRequired(
			this.db.select(ALL_FIELDS_WITH_RELATIONS).from(photos),
		)
			.where(eq(photos.id, photoId))
			.get();

		if (!result) return null;

		return transformToPhotoWithRequiredRelations(result);
	}

	/**
	 * Get user's submissions with filtering (guarantees competition/category exist)
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
	): Promise<{ photos: PhotoWithRelations[]; total: number }> {
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

		// Get photos with required relations (inner joins ensure competition/category exist)
		const photoList = await addPhotoJoinsRequired(
			this.db.select(ALL_FIELDS_WITH_RELATIONS).from(photos),
		)
			.where(whereClause)
			.orderBy(desc(photos.createdAt))
			.limit(limit)
			.offset(offset);

		return {
			photos: photoList.map(transformToPhotoWithRequiredRelations),
			total,
		};
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

		// Get total count
		const [{ total }] = await this.db
			.select({ total: count() })
			.from(photos)
			.where(whereClause);

		// Get photos with user information
		const photoList = await addPhotoJoins(
			this.db.select(ALL_FIELDS_WITH_RELATIONS).from(photos),
		)
			.where(whereClause)
			.orderBy(desc(photos.createdAt))
			.limit(limit)
			.offset(offset);

		return { photos: photoList.map(transformToPhotoWithRelations), total };
	}

	/**
	 * Get photos by competition with optional category filter
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

		const whereClause = and(...conditions);

		// Get total count
		const [{ total }] = await this.db
			.select({ total: count() })
			.from(photos)
			.where(whereClause);

		// Get photos with user information
		const photoList = await addPhotoJoins(
			this.db.select(ALL_FIELDS_WITH_RELATIONS).from(photos),
		)
			.where(whereClause)
			.orderBy(desc(photos.createdAt))
			.limit(limit)
			.offset(offset);

		return { photos: photoList.map(transformToPhotoWithRelations), total };
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
		action: "approve" | "reject" | "reset",
		reason?: string,
	): Promise<Photo> {
		const photo = await this.getPhotoById(photoId);
		if (!photo) {
			throw new Error("Photo not found");
		}

		let newStatus: "pending" | "approved" | "rejected";
		if (action === "approve") {
			newStatus = "approved";
		} else if (action === "reject") {
			newStatus = "rejected";
		} else if (action === "reset") {
			newStatus = "pending";
		} else {
			throw new Error("Invalid action");
		}

		await this.db
			.update(photos)
			.set({
				status: newStatus,
				moderatedBy: action === "reset" ? null : moderatorId,
				moderatedAt: action === "reset" ? null : new Date(),
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
	): Promise<{ photos: PhotoWithRelations[]; total: number }> {
		const { limit = 20, offset = 0 } = options;

		const whereClause = eq(photos.status, "pending");

		// Get total count
		const [{ total }] = await this.db
			.select({ total: count() })
			.from(photos)
			.where(whereClause);

		// Get photos with admin relations (includes moderatedByUser)
		const photoList = await this.db
			.select({
				...ALL_FIELDS_WITH_RELATIONS,
				user: {
					id: user.id,
					name: user.name,
				},
				competition: {
					id: competitions.id,
					title: competitions.title,
				},
				category: {
					id: categories.id,
					name: categories.name,
				},
				moderatedByUser: {
					id: sql`moderator.id`,
					name: sql`moderator.name`,
				},
			})
			.from(photos)
			.leftJoin(user, eq(user.id, photos.userId))
			.leftJoin(competitions, eq(competitions.id, photos.competitionId))
			.leftJoin(categories, eq(categories.id, photos.categoryId))
			.leftJoin(
				sql`user AS moderator`,
				sql`moderator.id = ${photos.moderatedBy}`,
			)
			.where(whereClause)
			.orderBy(asc(photos.createdAt)) // Oldest first for moderation
			.limit(limit)
			.offset(offset);

		// Transform to PhotoWithRelations format with admin fields
		const transformedPhotos = photoList.map((row) => ({
			...transformToPhotoWithRelations(row),
			user: {
				id: row.user?.id,
				name: row.user?.name,
			},
			competition: {
				id: row.competition?.id,
				title: row.competition?.title,
			},
			category: {
				id: row.category?.id,
				name: row.category?.name,
			},
			moderatedByUser: {
				id: row.moderatedByUser?.id as string | undefined,
				name: row.moderatedByUser?.name as string | undefined,
			},
		}));

		return { photos: transformedPhotos, total };
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
		const { limit = 50, offset = 0, status = "all" } = options;

		// Build where clause based on status filter
		// biome-ignore lint/suspicious/noExplicitAny: Complex drizzle query types
		let whereClause: any;
		if (status === "all") {
			whereClause = sql`${photos.status} != 'deleted'`; // Show all except deleted
		} else {
			whereClause = eq(photos.status, status);
		}

		// Get total count
		const [{ total }] = await this.db
			.select({ total: count() })
			.from(photos)
			.where(whereClause);

		// Get photos with all relations (same structure as moderation)
		const photoList = await this.db
			.select({
				...ALL_FIELDS_WITH_RELATIONS,
				user: {
					id: user.id,
					name: user.name,
				},
				competition: {
					id: competitions.id,
					title: competitions.title,
				},
				category: {
					id: categories.id,
					name: categories.name,
				},
				moderatedByUser: {
					id: sql`moderator.id`,
					name: sql`moderator.name`,
				},
			})
			.from(photos)
			.leftJoin(user, eq(user.id, photos.userId))
			.leftJoin(competitions, eq(competitions.id, photos.competitionId))
			.leftJoin(categories, eq(categories.id, photos.categoryId))
			.leftJoin(
				sql`user AS moderator`,
				sql`moderator.id = ${photos.moderatedBy}`,
			)
			.where(whereClause)
			.orderBy(desc(photos.createdAt)) // Newest first for admin view
			.limit(limit)
			.offset(offset);

		// Transform to PhotoWithRelations format with admin fields
		const transformedPhotos = photoList.map((row) => ({
			...transformToPhotoWithRelations(row),
			user: {
				id: row.user?.id,
				name: row.user?.name,
			},
			competition: {
				id: row.competition?.id,
				title: row.competition?.title,
			},
			category: {
				id: row.category?.id,
				name: row.category?.name,
			},
			moderatedByUser: {
				id: row.moderatedByUser?.id as string | undefined,
				name: row.moderatedByUser?.name as string | undefined,
			},
		}));

		return { photos: transformedPhotos, total };
	}

	/**
	 * Submit multiple photos in a batch
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
		const results: Photo[] = [];
		const errors: Array<{ index: number; error: string; photo?: unknown }> = [];

		// Process each photo
		for (let i = 0; i < batchData.photos.length; i++) {
			const photoData = batchData.photos[i];
			try {
				// Check submission limits for this category
				await this.checkSubmissionLimits(
					userId,
					batchData.competitionId,
					photoData.categoryId,
				);

				// Check for duplicate submissions (same title in same category)
				const existingPhoto = await this.db
					.select()
					.from(photos)
					.where(
						and(
							eq(photos.userId, userId),
							eq(photos.competitionId, batchData.competitionId),
							eq(photos.categoryId, photoData.categoryId),
							eq(photos.title, photoData.title),
							sql`${photos.status} != 'deleted'`,
						),
					)
					.get();

				if (existingPhoto) {
					errors.push({
						index: i,
						error: "A photo with this title already exists in this category",
						photo: photoData,
					});
					continue;
				}

				const photoId = generateId();
				const newPhoto: NewPhoto = {
					id: photoId,
					userId,
					competitionId: batchData.competitionId,
					...photoData,
					status: "pending",
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				await this.db.insert(photos).values(newPhoto);

				const photo = await this.getPhotoById(photoId);
				if (!photo) {
					errors.push({
						index: i,
						error: "Failed to create photo",
						photo: photoData,
					});
					continue;
				}

				results.push(photo);
			} catch (error) {
				console.error(`Error submitting photo ${i}:`, error);
				errors.push({
					index: i,
					error: error instanceof Error ? error.message : "Unknown error",
					photo: photoData,
				});
			}
		}

		return {
			success: results,
			errors,
		};
	}
}
