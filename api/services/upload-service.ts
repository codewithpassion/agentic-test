import { R2StorageService } from "../../workers/lib/r2";
import { generateId, generateSecureFilename } from "../lib/utils";
import {
	validateFileSize,
	validateFileType,
	validateImageDimensions,
} from "../lib/validation";

export interface UploadDetails {
	photoId: string;
	signedUrl: string;
	filePath: string;
	expiresAt: Date;
}

export interface FileUploadRequest {
	fileName: string;
	fileSize: number;
	mimeType: string;
	competitionId: string;
}

export interface ConfirmUploadRequest {
	photoId: string;
	filePath: string;
	width: number;
	height: number;
}

export class UploadService {
	private r2Service: R2StorageService;

	constructor(r2Bucket: R2Bucket) {
		this.r2Service = new R2StorageService(r2Bucket);
	}

	/**
	 * Generate signed URL for direct upload
	 */
	async getSignedUrl(request: FileUploadRequest): Promise<UploadDetails> {
		// Validate file type
		const typeValidation = validateFileType(request.mimeType);
		if (!typeValidation.valid) {
			throw new Error(typeValidation.error);
		}

		// Validate file size
		const sizeValidation = validateFileSize(request.fileSize);
		if (!sizeValidation.valid) {
			throw new Error(sizeValidation.error);
		}

		// Generate unique photo ID and secure filename
		const photoId = generateId();
		const secureFilename = generateSecureFilename(request.fileName);
		const filePath = R2StorageService.generateFileKey(
			request.competitionId,
			photoId,
			secureFilename,
			"original",
		);

		try {
			// Generate signed URL for direct upload
			const result = await this.r2Service.getSignedUploadUrl(filePath, 15 * 60); // 15 minutes

			if (!result.success || !result.signedUrl) {
				throw new Error(result.error || "Failed to generate signed URL");
			}

			return {
				photoId,
				signedUrl: result.signedUrl,
				filePath,
				expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
			};
		} catch (error) {
			console.error("Failed to generate signed URL:", error);
			throw new Error("Failed to generate upload URL");
		}
	}

	/**
	 * Confirm successful upload and validate file
	 */
	async confirmUpload(request: ConfirmUploadRequest): Promise<{
		success: boolean;
		fileInfo?: { size?: number; lastModified?: Date; contentType?: string };
	}> {
		try {
			// Validate image dimensions
			const dimensionsValidation = validateImageDimensions(
				request.width,
				request.height,
			);
			if (!dimensionsValidation.valid) {
				// Delete the uploaded file since it doesn't meet requirements
				await this.deleteFile(request.filePath);
				throw new Error(dimensionsValidation.error);
			}

			// Verify file exists in R2
			const fileExists = await this.r2Service.fileExists(request.filePath);
			if (!fileExists) {
				throw new Error("Uploaded file not found");
			}

			// Get file object for metadata
			const fileObject = await this.r2Service.getFile(request.filePath);

			// Additional validation could go here (e.g., virus scanning, content analysis)

			return {
				success: true,
				fileInfo: {
					size: fileObject?.size,
					lastModified: fileObject?.uploaded,
					contentType: fileObject?.httpMetadata?.contentType,
				},
			};
		} catch (error) {
			console.error("Upload confirmation failed:", error);
			throw error;
		}
	}

	/**
	 * Delete file from R2 storage
	 */
	async deleteFile(filePath: string): Promise<void> {
		try {
			const success = await this.r2Service.deleteFile(filePath);
			if (!success) {
				throw new Error("Delete operation failed");
			}
		} catch (error) {
			console.error("Failed to delete file:", error);
			throw new Error("Failed to delete file");
		}
	}

	/**
	 * Generate thumbnail or resized version (placeholder for future implementation)
	 */
	async generateThumbnail(filePath: string): Promise<string> {
		// TODO: Implement thumbnail generation using Cloudflare Images or similar
		// For now, return the original file path
		return filePath;
	}

	/**
	 * Get file info from R2
	 */
	async getFileInfo(filePath: string) {
		const fileObject = await this.r2Service.getFile(filePath);
		return {
			exists: !!fileObject,
			size: fileObject?.size,
			lastModified: fileObject?.uploaded,
			contentType: fileObject?.httpMetadata?.contentType,
		};
	}

	/**
	 * Get signed URL for viewing/downloading file
	 */
	async getViewUrl(
		filePath: string,
		_expiresIn: number = 60 * 60,
	): Promise<string> {
		// For now, return public URL since R2StorageService doesn't have signed download URLs
		return this.r2Service.getPublicUrl(filePath);
	}

	/**
	 * Cleanup expired uploads (could be called via cron job)
	 */
	async cleanupExpiredUploads(
		_competitionId: string,
		_olderThanMinutes = 30,
	): Promise<number> {
		// This would typically be implemented with a database of pending uploads
		// For now, just return 0 as a placeholder
		return 0;
	}

	/**
	 * Validate uploaded file against requirements
	 */
	private async _validateUploadedFile(filePath: string): Promise<{
		valid: boolean;
		error?: string;
		metadata?: { size?: number; contentType?: string; lastModified?: Date };
	}> {
		try {
			const fileObject = await this.r2Service.getFile(filePath);

			if (!fileObject) {
				return { valid: false, error: "File not found" };
			}

			// Check file size
			const sizeValidation = validateFileSize(fileObject.size || 0);
			if (!sizeValidation.valid) {
				return { valid: false, error: sizeValidation.error };
			}

			// Check file type
			const typeValidation = validateFileType(
				fileObject.httpMetadata?.contentType || "",
			);
			if (!typeValidation.valid) {
				return { valid: false, error: typeValidation.error };
			}

			return {
				valid: true,
				metadata: {
					size: fileObject.size,
					contentType: fileObject.httpMetadata?.contentType,
					lastModified: fileObject.uploaded,
				},
			};
		} catch (error) {
			return { valid: false, error: "Failed to validate file" };
		}
	}
}
