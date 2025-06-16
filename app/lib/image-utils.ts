/**
 * Image processing utilities for client-side operations
 */

export interface ThumbnailOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	format?: "jpeg" | "png" | "webp";
}

export interface CompressionOptions {
	quality?: number;
	maxWidth?: number;
	maxHeight?: number;
	format?: "jpeg" | "png" | "webp";
}

/**
 * Generate thumbnail from file
 */
export function generateThumbnail(
	file: File,
	options: ThumbnailOptions = {},
): Promise<string> {
	const {
		maxWidth = 200,
		maxHeight = 200,
		quality = 0.8,
		format = "jpeg",
	} = options;

	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					throw new Error("Failed to get canvas context");
				}

				// Calculate new dimensions maintaining aspect ratio
				const { width, height } = calculateThumbnailDimensions(
					img.naturalWidth,
					img.naturalHeight,
					maxWidth,
					maxHeight,
				);

				canvas.width = width;
				canvas.height = height;

				// Draw the image on canvas with new dimensions
				ctx.drawImage(img, 0, 0, width, height);

				// Convert to data URL
				const mimeType = `image/${format}`;
				const dataUrl = canvas.toDataURL(mimeType, quality);

				URL.revokeObjectURL(url);
				resolve(dataUrl);
			} catch (error) {
				URL.revokeObjectURL(url);
				reject(error);
			}
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};

		img.src = url;
	});
}

/**
 * Calculate thumbnail dimensions maintaining aspect ratio
 */
export function calculateThumbnailDimensions(
	originalWidth: number,
	originalHeight: number,
	maxWidth: number,
	maxHeight: number,
): { width: number; height: number } {
	const aspectRatio = originalWidth / originalHeight;

	let width = maxWidth;
	let height = maxHeight;

	if (aspectRatio > 1) {
		// Landscape orientation
		height = Math.round(width / aspectRatio);
		if (height > maxHeight) {
			height = maxHeight;
			width = Math.round(height * aspectRatio);
		}
	} else {
		// Portrait or square orientation
		width = Math.round(height * aspectRatio);
		if (width > maxWidth) {
			width = maxWidth;
			height = Math.round(width / aspectRatio);
		}
	}

	return { width, height };
}

/**
 * Compress image file
 */
export function compressImage(
	file: File,
	options: CompressionOptions = {},
): Promise<File> {
	const {
		quality = 0.8,
		maxWidth = 2048,
		maxHeight = 2048,
		format = "jpeg",
	} = options;

	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					throw new Error("Failed to get canvas context");
				}

				// Calculate new dimensions
				const { width, height } = calculateThumbnailDimensions(
					img.naturalWidth,
					img.naturalHeight,
					maxWidth,
					maxHeight,
				);

				canvas.width = width;
				canvas.height = height;

				// Draw the image on canvas
				ctx.drawImage(img, 0, 0, width, height);

				// Convert to blob
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error("Failed to compress image"));
							return;
						}

						// Create new file from blob
						const compressedFile = new File([blob], file.name, {
							type: `image/${format}`,
							lastModified: Date.now(),
						});

						URL.revokeObjectURL(url);
						resolve(compressedFile);
					},
					`image/${format}`,
					quality,
				);
			} catch (error) {
				URL.revokeObjectURL(url);
				reject(error);
			}
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};

		img.src = url;
	});
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(
	file: File,
): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({
				width: img.naturalWidth,
				height: img.naturalHeight,
			});
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};

		img.src = url;
	});
}

/**
 * Generate image preview URL
 */
export function generatePreviewUrl(file: File): string {
	return URL.createObjectURL(file);
}

/**
 * Revoke preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
	URL.revokeObjectURL(url);
}

/**
 * Convert file to base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			resolve(reader.result as string);
		};

		reader.onerror = () => {
			reject(new Error("Failed to read file"));
		};

		reader.readAsDataURL(file);
	});
}

/**
 * Extract EXIF data from image file
 */
export function extractExifData(file: File): Promise<Record<string, unknown>> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			try {
				// Basic EXIF extraction (would need a library like exif-js for full support)
				// For now, just return basic file info
				resolve({
					fileName: file.name,
					fileSize: file.size,
					lastModified: new Date(file.lastModified),
					type: file.type,
				});
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = () => {
			reject(new Error("Failed to read file"));
		};

		reader.readAsArrayBuffer(file);
	});
}

/**
 * Check if image needs compression based on size and dimensions
 */
export async function shouldCompressImage(
	file: File,
	maxFileSize = 5 * 1024 * 1024, // 5MB
	maxWidth = 2048,
	maxHeight = 2048,
): Promise<boolean> {
	// Check file size
	if (file.size > maxFileSize) {
		return true;
	}

	// Check dimensions
	try {
		const dimensions = await getImageDimensions(file);
		if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
			return true;
		}
	} catch {
		// If we can't get dimensions, don't compress
		return false;
	}

	return false;
}

/**
 * Resize image to fit within bounds while maintaining aspect ratio
 */
export function resizeImage(
	file: File,
	maxWidth: number,
	maxHeight: number,
	quality = 0.9,
): Promise<File> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					throw new Error("Failed to get canvas context");
				}

				const { width, height } = calculateThumbnailDimensions(
					img.naturalWidth,
					img.naturalHeight,
					maxWidth,
					maxHeight,
				);

				canvas.width = width;
				canvas.height = height;

				// Enable image smoothing for better quality
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = "high";

				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error("Failed to resize image"));
							return;
						}

						const resizedFile = new File([blob], file.name, {
							type: file.type,
							lastModified: Date.now(),
						});

						URL.revokeObjectURL(url);
						resolve(resizedFile);
					},
					file.type,
					quality,
				);
			} catch (error) {
				URL.revokeObjectURL(url);
				reject(error);
			}
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image"));
		};

		img.src = url;
	});
}
