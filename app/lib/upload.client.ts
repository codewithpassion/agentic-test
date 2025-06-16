/**
 * Client-side upload service for handling file uploads to R2
 */

export interface UploadResult {
	success: boolean;
	error?: string;
	progress?: number;
}

export interface UploadDetails {
	photoId: string;
	signedUrl: string;
	filePath: string;
	expiresAt: Date;
}

export interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
}

export interface UploadOptions {
	onProgress?: (progress: UploadProgress) => void;
	signal?: AbortSignal;
	retries?: number;
	retryDelay?: number;
}

/**
 * Upload service for handling file uploads
 */
export class UploadService {
	private static readonly DEFAULT_RETRY_DELAY = 1000;
	private static readonly MAX_RETRIES = 3;

	/**
	 * Upload file to R2 using signed URL
	 */
	async uploadFile(
		file: File,
		signedUrl: string,
		options: UploadOptions = {},
	): Promise<UploadResult> {
		const { onProgress, signal, retries = UploadService.MAX_RETRIES } = options;

		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				const result = await this.attemptUpload(file, signedUrl, {
					onProgress,
					signal,
				});

				if (result.success) {
					return result;
				}

				// If it's the last attempt, return the error
				if (attempt === retries) {
					return result;
				}

				// Wait before retrying
				await this.delay(
					options.retryDelay ||
						UploadService.DEFAULT_RETRY_DELAY * (attempt + 1),
				);
			} catch (error) {
				if (attempt === retries) {
					return {
						success: false,
						error: error instanceof Error ? error.message : "Upload failed",
					};
				}

				// Wait before retrying
				await this.delay(
					options.retryDelay ||
						UploadService.DEFAULT_RETRY_DELAY * (attempt + 1),
				);
			}
		}

		return {
			success: false,
			error: "Upload failed after maximum retries",
		};
	}

	/**
	 * Single upload attempt
	 */
	private async attemptUpload(
		file: File,
		signedUrl: string,
		options: Pick<UploadOptions, "onProgress" | "signal">,
	): Promise<UploadResult> {
		return new Promise((resolve) => {
			const xhr = new XMLHttpRequest();

			// Set up progress tracking
			if (options.onProgress) {
				xhr.upload.addEventListener("progress", (event) => {
					if (event.lengthComputable) {
						const progress: UploadProgress = {
							loaded: event.loaded,
							total: event.total,
							percentage: Math.round((event.loaded / event.total) * 100),
						};
						options.onProgress?.(progress);
					}
				});
			}

			// Handle completion
			xhr.addEventListener("load", () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					resolve({ success: true });
				} else {
					resolve({
						success: false,
						error: `Upload failed with status ${xhr.status}`,
					});
				}
			});

			// Handle errors
			xhr.addEventListener("error", () => {
				resolve({
					success: false,
					error: "Network error during upload",
				});
			});

			// Handle abort
			xhr.addEventListener("abort", () => {
				resolve({
					success: false,
					error: "Upload aborted",
				});
			});

			// Handle timeout
			xhr.addEventListener("timeout", () => {
				resolve({
					success: false,
					error: "Upload timeout",
				});
			});

			// Set up abort signal
			if (options.signal) {
				options.signal.addEventListener("abort", () => {
					xhr.abort();
				});
			}

			// Configure and send request
			xhr.open("PUT", signedUrl);
			xhr.setRequestHeader("Content-Type", file.type);
			xhr.timeout = 5 * 60 * 1000; // 5 minute timeout
			xhr.send(file);
		});
	}

	/**
	 * Upload multiple files concurrently
	 */
	async uploadFiles(
		uploads: Array<{ file: File; signedUrl: string }>,
		options: UploadOptions & { maxConcurrent?: number } = {},
	): Promise<Array<{ file: File; result: UploadResult }>> {
		const { maxConcurrent = 3, ...uploadOptions } = options;
		const results: Array<{ file: File; result: UploadResult }> = [];

		// Process uploads in batches
		for (let i = 0; i < uploads.length; i += maxConcurrent) {
			const batch = uploads.slice(i, i + maxConcurrent);
			const batchPromises = batch.map(async ({ file, signedUrl }) => {
				const result = await this.uploadFile(file, signedUrl, uploadOptions);
				return { file, result };
			});

			const batchResults = await Promise.all(batchPromises);
			results.push(...batchResults);
		}

		return results;
	}

	/**
	 * Calculate upload speed
	 */
	calculateSpeed(loaded: number, startTime: number): number {
		const elapsed = (Date.now() - startTime) / 1000; // seconds
		return elapsed > 0 ? loaded / elapsed : 0; // bytes per second
	}

	/**
	 * Estimate time remaining
	 */
	estimateTimeRemaining(loaded: number, total: number, speed: number): number {
		if (speed <= 0) return 0;
		const remaining = total - loaded;
		return remaining / speed; // seconds
	}

	/**
	 * Format upload speed for display
	 */
	formatSpeed(bytesPerSecond: number): string {
		if (bytesPerSecond === 0) return "0 B/s";

		const units = ["B/s", "KB/s", "MB/s", "GB/s"];
		let size = bytesPerSecond;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(1)} ${units[unitIndex]}`;
	}

	/**
	 * Format time remaining for display
	 */
	formatTimeRemaining(seconds: number): string {
		if (seconds === 0 || !Number.isFinite(seconds)) return "Unknown";

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m ${secs}s`;
		}
		if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		}
		return `${secs}s`;
	}

	/**
	 * Check if error is retryable
	 */
	isRetryableError(error: string): boolean {
		const retryableErrors = [
			"network error",
			"timeout",
			"connection",
			"temporary",
			"503",
			"502",
			"504",
		];

		return retryableErrors.some((retryableError) =>
			error.toLowerCase().includes(retryableError),
		);
	}

	/**
	 * Delay utility for retries
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Singleton instance of upload service
 */
export const uploadService = new UploadService();

/**
 * Upload manager for coordinating multiple uploads
 */
export class UploadManager {
	private uploads = new Map<string, AbortController>();
	private progressCallbacks = new Map<
		string,
		(progress: UploadProgress) => void
	>();

	/**
	 * Start upload with tracking
	 */
	async startUpload(
		id: string,
		file: File,
		signedUrl: string,
		onProgress?: (progress: UploadProgress) => void,
	): Promise<UploadResult> {
		// Cancel existing upload with same ID
		this.cancelUpload(id);

		const controller = new AbortController();
		this.uploads.set(id, controller);

		if (onProgress) {
			this.progressCallbacks.set(id, onProgress);
		}

		try {
			const result = await uploadService.uploadFile(file, signedUrl, {
				signal: controller.signal,
				onProgress: (progress) => {
					const callback = this.progressCallbacks.get(id);
					callback?.(progress);
				},
			});

			// Clean up
			this.uploads.delete(id);
			this.progressCallbacks.delete(id);

			return result;
		} catch (error) {
			// Clean up
			this.uploads.delete(id);
			this.progressCallbacks.delete(id);

			return {
				success: false,
				error: error instanceof Error ? error.message : "Upload failed",
			};
		}
	}

	/**
	 * Cancel upload
	 */
	cancelUpload(id: string): void {
		const controller = this.uploads.get(id);
		if (controller) {
			controller.abort();
			this.uploads.delete(id);
			this.progressCallbacks.delete(id);
		}
	}

	/**
	 * Cancel all uploads
	 */
	cancelAllUploads(): void {
		for (const [id] of this.uploads) {
			this.cancelUpload(id);
		}
	}

	/**
	 * Get active upload count
	 */
	getActiveUploadCount(): number {
		return this.uploads.size;
	}

	/**
	 * Check if upload is active
	 */
	isUploadActive(id: string): boolean {
		return this.uploads.has(id);
	}
}

/**
 * Global upload manager instance
 */
export const uploadManager = new UploadManager();
