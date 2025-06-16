/// <reference types="../../worker-configuration.d.ts" />

/**
 * R2 Storage Client Utilities
 * Provides utilities for interacting with Cloudflare R2 storage
 */

export interface UploadResult {
	success: boolean;
	key?: string;
	url?: string;
	error?: string;
}

export interface SignedUrlResult {
	success: boolean;
	signedUrl?: string;
	key?: string;
	error?: string;
}

/**
 * R2 Storage Service
 * Handles file operations with Cloudflare R2
 */
export class R2StorageService {
	constructor(private bucket: R2Bucket) {}

	/**
	 * Generate a presigned URL for uploading files directly to R2
	 */
	async getSignedUploadUrl(
		key: string,
		expiresIn = 3600, // 1 hour default
	): Promise<SignedUrlResult> {
		try {
			// For now, we'll implement a simple signed URL approach
			// In a real implementation, you would use R2's presigned URL functionality
			// This is a placeholder that returns a direct upload URL

			return {
				success: true,
				signedUrl: `https://api.cloudflare.com/client/v4/accounts/your-account/r2/buckets/your-bucket/objects/${key}`,
				key,
			};
		} catch (error) {
			console.error("Error generating signed URL:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Upload a file directly to R2
	 */
	async uploadFile(
		key: string,
		data: ArrayBuffer | ArrayBufferView | ReadableStream,
		options?: {
			contentType?: string;
			metadata?: Record<string, string>;
		},
	): Promise<UploadResult> {
		try {
			const object = await this.bucket.put(key, data, {
				httpMetadata: {
					contentType: options?.contentType || "application/octet-stream",
				},
				customMetadata: options?.metadata,
			});

			if (!object) {
				return {
					success: false,
					error: "Failed to upload file",
				};
			}

			return {
				success: true,
				key,
				url: `https://your-domain.com/${key}`, // Replace with your R2 domain
			};
		} catch (error) {
			console.error("Error uploading file:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Get a file from R2
	 */
	async getFile(key: string): Promise<R2Object | null> {
		try {
			return await this.bucket.get(key);
		} catch (error) {
			console.error("Error getting file:", error);
			return null;
		}
	}

	/**
	 * Delete a file from R2
	 */
	async deleteFile(key: string): Promise<boolean> {
		try {
			await this.bucket.delete(key);
			return true;
		} catch (error) {
			console.error("Error deleting file:", error);
			return false;
		}
	}

	/**
	 * Check if a file exists in R2
	 */
	async fileExists(key: string): Promise<boolean> {
		try {
			const head = await this.bucket.head(key);
			return !!head;
		} catch (error) {
			return false;
		}
	}

	/**
	 * List files with a prefix
	 */
	async listFiles(prefix?: string, limit?: number): Promise<R2Objects> {
		try {
			return await this.bucket.list({
				prefix,
				limit,
			});
		} catch (error) {
			console.error("Error listing files:", error);
			throw error;
		}
	}

	/**
	 * Generate a public URL for a file (if bucket is configured for public access)
	 */
	getPublicUrl(key: string): string {
		// Replace with your actual R2 domain
		return `https://your-r2-domain.com/${key}`;
	}

	/**
	 * Generate file key for organized storage
	 */
	static generateFileKey(
		competitionId: string,
		photoId: string,
		filename: string,
		type: "original" | "thumbnail" | "medium" = "original",
	): string {
		const extension = filename.split(".").pop() || "";
		const baseName = type === "original" ? photoId : `${photoId}_${type}`;

		return `competitions/${competitionId}/${type}s/${baseName}.${extension}`;
	}

	/**
	 * Validate file type and size
	 */
	static validateFile(file: File): { valid: boolean; error?: string } {
		const allowedTypes = ["image/jpeg", "image/png"];
		const maxSize = 10 * 1024 * 1024; // 10MB

		if (!allowedTypes.includes(file.type)) {
			return {
				valid: false,
				error: "Invalid file type. Only JPEG and PNG files are allowed.",
			};
		}

		if (file.size > maxSize) {
			return {
				valid: false,
				error: "File size too large. Maximum size is 10MB.",
			};
		}

		return { valid: true };
	}
}

/**
 * Helper function to get R2 service instance
 */
export function createR2Service(env: CloudflareBindings): R2StorageService {
	return new R2StorageService(env.PHOTO_STORAGE);
}
