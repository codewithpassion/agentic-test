import { randomBytes } from "crypto";

/**
 * Generate a unique ID
 */
export function generateId(): string {
	return randomBytes(16).toString("hex");
}

/**
 * Generate a secure filename for R2 storage
 */
export function generateSecureFilename(originalFilename: string): string {
	const timestamp = Date.now();
	const randomPart = randomBytes(8).toString("hex");
	const extension = originalFilename.split(".").pop();
	return `${timestamp}-${randomPart}.${extension}`;
}

/**
 * Parse file extension from filename
 */
export function getFileExtension(filename: string): string {
	return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Convert bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
	return filename
		.replace(/[^a-zA-Z0-9.-]/g, "_")
		.replace(/_{2,}/g, "_")
		.toLowerCase();
}
