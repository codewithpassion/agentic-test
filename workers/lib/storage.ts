/**
 * Storage Abstraction Layer
 * Provides a unified interface for different storage backends
 */

import {
	R2StorageService,
	type SignedUrlResult,
	type UploadResult,
} from "./r2";

export interface StorageFile {
	key: string;
	url: string;
	size: number;
	contentType: string;
	lastModified: Date;
	metadata?: Record<string, string>;
}

export interface StorageService {
	uploadFile(
		key: string,
		data: ArrayBuffer | ArrayBufferView | ReadableStream,
		options?: {
			contentType?: string;
			metadata?: Record<string, string>;
		},
	): Promise<UploadResult>;

	getSignedUploadUrl(key: string, expiresIn?: number): Promise<SignedUrlResult>;

	getFile(key: string): Promise<StorageFile | null>;
	deleteFile(key: string): Promise<boolean>;
	fileExists(key: string): Promise<boolean>;
	getPublicUrl(key: string): string;
}

/**
 * R2 Storage Implementation
 */
export class R2Storage implements StorageService {
	private r2Service: R2StorageService;

	constructor(bucket: R2Bucket) {
		this.r2Service = new R2StorageService(bucket);
	}

	async uploadFile(
		key: string,
		data: ArrayBuffer | ArrayBufferView | ReadableStream,
		options?: {
			contentType?: string;
			metadata?: Record<string, string>;
		},
	): Promise<UploadResult> {
		return this.r2Service.uploadFile(key, data, options);
	}

	async getSignedUploadUrl(
		key: string,
		expiresIn = 3600,
	): Promise<SignedUrlResult> {
		return this.r2Service.getSignedUploadUrl(key, expiresIn);
	}

	async getFile(key: string): Promise<StorageFile | null> {
		const r2Object = await this.r2Service.getFile(key);

		if (!r2Object) {
			return null;
		}

		return {
			key,
			url: this.getPublicUrl(key),
			size: r2Object.size,
			contentType:
				r2Object.httpMetadata?.contentType || "application/octet-stream",
			lastModified: r2Object.uploaded,
			metadata: r2Object.customMetadata,
		};
	}

	async deleteFile(key: string): Promise<boolean> {
		return this.r2Service.deleteFile(key);
	}

	async fileExists(key: string): Promise<boolean> {
		return this.r2Service.fileExists(key);
	}

	getPublicUrl(key: string): string {
		return this.r2Service.getPublicUrl(key);
	}

	// R2-specific methods
	async listFiles(prefix?: string, limit?: number) {
		return this.r2Service.listFiles(prefix, limit);
	}
}

/**
 * Photo Storage Manager
 * Handles photo-specific storage operations
 */
export class PhotoStorageManager {
	constructor(private storage: StorageService) {}

	/**
	 * Upload original photo
	 */
	async uploadOriginal(
		competitionId: string,
		photoId: string,
		filename: string,
		data: ArrayBuffer | ArrayBufferView | ReadableStream,
		contentType: string,
	): Promise<UploadResult> {
		const key = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			"original",
		);

		return this.storage.uploadFile(key, data, {
			contentType,
			metadata: {
				competitionId,
				photoId,
				type: "original",
				originalFilename: filename,
			},
		});
	}

	/**
	 * Upload thumbnail
	 */
	async uploadThumbnail(
		competitionId: string,
		photoId: string,
		filename: string,
		data: ArrayBuffer | ArrayBufferView | ReadableStream,
	): Promise<UploadResult> {
		const key = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			"thumbnail",
		);

		return this.storage.uploadFile(key, data, {
			contentType: "image/jpeg",
			metadata: {
				competitionId,
				photoId,
				type: "thumbnail",
			},
		});
	}

	/**
	 * Upload medium size image
	 */
	async uploadMedium(
		competitionId: string,
		photoId: string,
		filename: string,
		data: ArrayBuffer | ArrayBufferView | ReadableStream,
	): Promise<UploadResult> {
		const key = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			"medium",
		);

		return this.storage.uploadFile(key, data, {
			contentType: "image/jpeg",
			metadata: {
				competitionId,
				photoId,
				type: "medium",
			},
		});
	}

	/**
	 * Get signed URL for direct upload
	 */
	async getUploadUrl(
		competitionId: string,
		photoId: string,
		filename: string,
		type: "original" | "thumbnail" | "medium" = "original",
	): Promise<SignedUrlResult> {
		const key = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			type,
		);

		return this.storage.getSignedUploadUrl(key);
	}

	/**
	 * Delete all photo files (original, thumbnail, medium)
	 */
	async deletePhoto(
		competitionId: string,
		photoId: string,
		filename: string,
	): Promise<{
		originalDeleted: boolean;
		thumbnailDeleted: boolean;
		mediumDeleted: boolean;
	}> {
		const originalKey = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			"original",
		);
		const thumbnailKey = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			"thumbnail",
		);
		const mediumKey = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			"medium",
		);

		const [originalDeleted, thumbnailDeleted, mediumDeleted] =
			await Promise.all([
				this.storage.deleteFile(originalKey),
				this.storage.deleteFile(thumbnailKey),
				this.storage.deleteFile(mediumKey),
			]);

		return {
			originalDeleted,
			thumbnailDeleted,
			mediumDeleted,
		};
	}

	/**
	 * Get photo URLs
	 */
	getPhotoUrls(
		competitionId: string,
		photoId: string,
		filename: string,
	): {
		original: string;
		thumbnail: string;
		medium: string;
	} {
		const originalKey = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			"original",
		);
		const thumbnailKey = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			"thumbnail",
		);
		const mediumKey = R2StorageService.generateFileKey(
			competitionId,
			photoId,
			filename,
			"medium",
		);

		return {
			original: this.storage.getPublicUrl(originalKey),
			thumbnail: this.storage.getPublicUrl(thumbnailKey),
			medium: this.storage.getPublicUrl(mediumKey),
		};
	}
}

/**
 * Create storage service factory
 */
export function createStorageService(env: CloudflareBindings): StorageService {
	return new R2Storage(env.PHOTO_STORAGE);
}

/**
 * Create photo storage manager factory
 */
export function createPhotoStorageManager(
	env: CloudflareBindings,
): PhotoStorageManager {
	const storage = createStorageService(env);
	return new PhotoStorageManager(storage);
}
