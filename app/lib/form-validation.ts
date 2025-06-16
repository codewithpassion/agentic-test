import type { ZodError } from "zod";

/**
 * Validate competition title
 */
export function validateCompetitionTitle(title: string): string | null {
	if (!title.trim()) return "Title is required";
	if (title.length < 3) return "Title must be at least 3 characters";
	if (title.length > 100) return "Title must be less than 100 characters";

	// Check for basic special characters that might cause issues
	const invalidChars = /[<>{}[\]\\]/;
	if (invalidChars.test(title)) return "Title contains invalid characters";

	return null;
}

/**
 * Validate competition description
 */
export function validateCompetitionDescription(
	description: string,
): string | null {
	if (!description.trim()) return "Description is required";
	if (description.length < 10)
		return "Description must be at least 10 characters";
	if (description.length > 2000)
		return "Description must be less than 2000 characters";

	return null;
}

/**
 * Validate date range (start and end dates)
 */
export function validateDateRange(
	startDate?: Date | string,
	endDate?: Date | string,
): string | null {
	if (!startDate || !endDate) return null; // Both optional

	const start = new Date(startDate);
	const end = new Date(endDate);

	if (Number.isNaN(start.getTime())) return "Invalid start date";
	if (Number.isNaN(end.getTime())) return "Invalid end date";

	if (end <= start) return "End date must be after start date";

	// Check if dates are reasonable (not too far in the future)
	const maxFutureYears = 5;
	const maxFutureDate = new Date();
	maxFutureDate.setFullYear(maxFutureDate.getFullYear() + maxFutureYears);

	if (start > maxFutureDate || end > maxFutureDate) {
		return `Dates cannot be more than ${maxFutureYears} years in the future`;
	}

	return null;
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string): string | null {
	if (!name.trim()) return "Category name is required";
	if (name.length < 2) return "Category name must be at least 2 characters";
	if (name.length > 50) return "Category name must be less than 50 characters";

	// Check for special characters
	const invalidChars = /[<>{}[\]\\]/;
	if (invalidChars.test(name))
		return "Category name contains invalid characters";

	return null;
}

/**
 * Validate photo limit
 */
export function validatePhotoLimit(limit: number): string | null {
	if (!Number.isInteger(limit)) return "Photo limit must be a whole number";
	if (limit < 1) return "Photo limit must be at least 1";
	if (limit > 20) return "Photo limit cannot exceed 20";

	return null;
}

/**
 * Convert Zod errors to user-friendly messages
 */
export function formatValidationError(error: ZodError): Record<string, string> {
	const formatted: Record<string, string> = {};

	for (const issue of error.issues) {
		const path = issue.path.join(".");
		formatted[path] = issue.message;
	}

	return formatted;
}

/**
 * Get a specific field error from an error object
 */
export function getFieldError(
	errors: Record<string, string>,
	field: string,
): string | undefined {
	return errors[field];
}

/**
 * Check if there are any errors in the error object
 */
export function hasErrors(errors: Record<string, string>): boolean {
	return Object.keys(errors).length > 0;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
	return input
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F;");
}

/**
 * Validate file size (for future photo uploads)
 */
export function validateFileSize(size: number, maxSizeMB = 10): string | null {
	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	if (size > maxSizeBytes) return `File size cannot exceed ${maxSizeMB}MB`;
	return null;
}

/**
 * Validate file type (for future photo uploads)
 */
export function validateFileType(
	type: string,
	allowedTypes: string[] = ["image/jpeg", "image/png", "image/webp"],
): string | null {
	if (!allowedTypes.includes(type)) {
		return `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`;
	}
	return null;
}
