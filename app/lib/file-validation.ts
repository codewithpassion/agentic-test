/**
 * Client-side file validation utilities
 */

export interface FileValidationRules {
	maxSize: number;
	allowedTypes: string[];
	minDimensions?: { width: number; height: number };
	maxDimensions?: { width: number; height: number };
}

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

export const DEFAULT_VALIDATION_RULES: FileValidationRules = {
	maxSize: 10 * 1024 * 1024, // 10MB
	allowedTypes: ["image/jpeg", "image/jpg", "image/png"],
	minDimensions: { width: 800, height: 600 },
	maxDimensions: { width: 8000, height: 6000 },
};

/**
 * Validate file type and extension
 */
export function validateFileType(
	file: File,
	allowedTypes: string[],
): ValidationResult {
	// Check MIME type
	if (!allowedTypes.includes(file.type)) {
		return {
			valid: false,
			error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
		};
	}

	// Check file extension as additional security
	const extension = file.name.split(".").pop()?.toLowerCase();
	const validExtensions = allowedTypes
		.map((type) => type.split("/")[1])
		.concat(["jpg"]); // Add jpg as alias for jpeg

	if (!extension || !validExtensions.includes(extension)) {
		return {
			valid: false,
			error: `Invalid file extension. File must be a ${validExtensions.join(
				" or ",
			)} file.`,
		};
	}

	return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(
	file: File,
	maxSize: number,
): ValidationResult {
	if (file.size > maxSize) {
		const maxSizeMB = Math.round(maxSize / (1024 * 1024));
		const fileSizeMB = Math.round(file.size / (1024 * 1024));
		return {
			valid: false,
			error: `File too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
		};
	}

	return { valid: true };
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
	width: number,
	height: number,
	rules: {
		min?: { width: number; height: number };
		max?: { width: number; height: number };
	},
): ValidationResult {
	if (rules.min) {
		if (width < rules.min.width || height < rules.min.height) {
			return {
				valid: false,
				error: `Image too small. Minimum size is ${rules.min.width}x${rules.min.height}px.`,
			};
		}
	}

	if (rules.max) {
		if (width > rules.max.width || height > rules.max.height) {
			return {
				valid: false,
				error: `Image too large. Maximum size is ${rules.max.width}x${rules.max.height}px.`,
			};
		}
	}

	return { valid: true };
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
	file: File,
	rules: FileValidationRules = DEFAULT_VALIDATION_RULES,
): Promise<ValidationResult> {
	// Validate file type
	const typeValidation = validateFileType(file, rules.allowedTypes);
	if (!typeValidation.valid) {
		return typeValidation;
	}

	// Validate file size
	const sizeValidation = validateFileSize(file, rules.maxSize);
	if (!sizeValidation.valid) {
		return sizeValidation;
	}

	// Validate image dimensions if specified
	if (rules.minDimensions || rules.maxDimensions) {
		try {
			const dimensions = await getImageDimensions(file);
			const dimensionValidation = validateImageDimensions(
				dimensions.width,
				dimensions.height,
				{
					min: rules.minDimensions,
					max: rules.maxDimensions,
				},
			);
			if (!dimensionValidation.valid) {
				return dimensionValidation;
			}
		} catch (error) {
			return {
				valid: false,
				error: "Unable to read image dimensions. File may be corrupted.",
			};
		}
	}

	return { valid: true };
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
 * Validate multiple files
 */
export async function validateFiles(
	files: File[],
	rules: FileValidationRules = DEFAULT_VALIDATION_RULES,
): Promise<{ valid: boolean; errors: Record<string, string> }> {
	const errors: Record<string, string> = {};

	for (const file of files) {
		const validation = await validateFile(file, rules);
		if (!validation.valid && validation.error) {
			errors[file.name] = validation.error;
		}
	}

	return {
		valid: Object.keys(errors).length === 0,
		errors,
	};
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
	return file.type.startsWith("image/");
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
	return filename.split(".").pop()?.toLowerCase() || "";
}
