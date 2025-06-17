/**
 * Simplified file upload hook for direct R2 uploads
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
	DEFAULT_VALIDATION_RULES,
	type FileValidationRules,
	validateFile,
} from "~/lib/file-validation";
import { compressImage, shouldCompressImage } from "~/lib/image-utils";
import { trpc } from "~/lib/trpc";

export interface UploadedFile {
	id: string;
	file: File;
	filePath: string;
	url?: string;
	key?: string;
}

export interface PhotoMetadata {
	title: string;
	description: string;
	location: string;
	dateTaken: Date;
	cameraMake?: string;
	cameraModel?: string;
	lens?: string;
	focalLength?: number;
	aperture?: string;
	shutterSpeed?: string;
	iso?: number;
	width?: number;
	height?: number;
}

export interface FileUploadState {
	id: string;
	file: File;
	status: "pending" | "validating" | "uploading" | "completed" | "failed";
	progress: number;
	error?: string;
	uploadedFile?: UploadedFile;
	speed?: number;
}

export interface UseFileUploadProps {
	onUploadProgress?: (files: FileUploadState[]) => void;
	maxFiles?: number;
	maxFileSize?: number;
	validationRules?: FileValidationRules;
	competitionId?: string;
	compressionEnabled?: boolean;
}

export function useFileUpload({
	onUploadProgress,
	maxFiles = 10,
	maxFileSize = 10 * 1024 * 1024,
	validationRules,
	competitionId,
	compressionEnabled = true,
}: UseFileUploadProps = {}) {
	const [files, setFiles] = useState<FileUploadState[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const uploadId = useRef(0);

	const rules: FileValidationRules = validationRules || {
		...DEFAULT_VALIDATION_RULES,
		maxSize: maxFileSize,
	};

	// tRPC mutation for uploading
	const uploadMutation = trpc.photos.upload.useMutation();

	// Generate unique ID for each file
	const generateFileId = useCallback(() => {
		return `file-${Date.now()}-${++uploadId.current}`;
	}, []);

	// Upload a specific file immediately via tRPC
	const startUploadForFile = useCallback(
		async (
			fileId: string,
			file: File,
			userId?: string,
			categoryId?: string,
			metadata?: PhotoMetadata,
		) => {
			console.log(
				"Starting upload for specific file:",
				fileId,
				"to competition:",
				competitionId,
			);
			if (!competitionId || !userId || !categoryId || !metadata) {
				console.error("Missing required upload parameters");
				return;
			}

			try {
				// Update status to uploading
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? { ...f, status: "uploading" as const, progress: 0 }
							: f,
					),
				);

				// Use tRPC to upload (convert File to ArrayBuffer)
				const fileBuffer = await file.arrayBuffer();
				console.log("Uploading file:", file.name, "as ArrayBuffer", fileBuffer);
				const uintArray = new Uint8Array(fileBuffer);
				const photo = await uploadMutation.mutateAsync({
					file: uintArray,
					fileName: file.name,
					fileType: file.type,
					competitionId,
					categoryId,
					...metadata,
				});

				// Mark as completed
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? {
									...f,
									status: "completed" as const,
									progress: 100,
									uploadedFile: {
										id: photo.id,
										file: file,
										filePath: photo.filePath,
										url: `/api/photos/serve/${encodeURIComponent(photo.filePath)}`,
										key: photo.filePath,
									},
								}
							: f,
					),
				);
				console.log("Upload completed for:", fileId);
			} catch (error) {
				console.error("Upload failed for file:", fileId, error);
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? {
									...f,
									status: "failed" as const,
									error:
										error instanceof Error ? error.message : "Upload failed",
								}
							: f,
					),
				);
			}
		},
		[competitionId, uploadMutation.mutateAsync],
	);

	// Validate and prepare a single file
	const validateAndPrepareFile = useCallback(
		async (fileState: FileUploadState) => {
			console.log("Starting validation for file:", fileState.id);
			setFiles((prev) =>
				prev.map((f) =>
					f.id === fileState.id ? { ...f, status: "validating" as const } : f,
				),
			);

			try {
				console.log(
					"Validating file:",
					fileState.file.name,
					"with rules:",
					rules,
				);
				// Validate file
				const validation = await validateFile(fileState.file, rules);
				console.log("Validation result:", validation);
				if (!validation.valid) {
					console.log("Validation failed:", validation.error);
					setFiles((prev) =>
						prev.map((f) =>
							f.id === fileState.id
								? { ...f, status: "failed" as const, error: validation.error }
								: f,
						),
					);
					return;
				}

				// Check if compression is needed
				let processedFile = fileState.file;
				console.log("Checking compression for:", fileState.file.name);
				if (compressionEnabled && (await shouldCompressImage(fileState.file))) {
					console.log("Compressing image:", fileState.file.name);
					try {
						processedFile = await compressImage(fileState.file, {
							quality: 0.8,
							maxWidth: 2048,
							maxHeight: 2048,
						});
						console.log("Compression completed");
					} catch (error) {
						console.warn("Compression failed, using original file:", error);
					}
				}

				console.log("Setting file to pending status");
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileState.id
							? { ...f, file: processedFile, status: "pending" as const }
							: f,
					),
				);
				console.log("File validation completed for:", fileState.id);

				// Note: Auto-upload will be handled by the PhotoMetadataCard component
				// when metadata is provided
			} catch (error) {
				console.log("Validation error:", error);
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileState.id
							? {
									...f,
									status: "failed" as const,
									error:
										error instanceof Error
											? error.message
											: "Validation failed",
								}
							: f,
					),
				);
			}
		},
		[rules, compressionEnabled],
	);

	// Batch upload all pending files (deprecated - now handled individually)
	const startUpload = useCallback(async () => {
		console.log(
			"startUpload called (deprecated - files upload individually now)",
		);
		// This method is now deprecated as files upload individually
		// when metadata is provided via PhotoMetadataCard
	}, []);

	// Add files to the upload queue
	const addFiles = useCallback(
		async (newFiles: File[]) => {
			// Limit number of files
			const currentCount = files.length;
			const availableSlots = maxFiles - currentCount;
			const filesToAdd = newFiles.slice(0, availableSlots);

			const fileStates: FileUploadState[] = filesToAdd.map((file) => ({
				id: generateFileId(),
				file,
				status: "pending",
				progress: 0,
			}));

			setFiles((prev) => [...prev, ...fileStates]);

			// Validate files
			for (const fileState of fileStates) {
				await validateAndPrepareFile(fileState);
			}

			// Auto-upload is now handled individually per file in PhotoMetadataCard
		},
		[files.length, maxFiles, generateFileId, validateAndPrepareFile],
	);

	// Remove file from upload queue
	const removeFile = useCallback((fileId: string) => {
		// Cancel upload if in progress (using XHR abort)
		// Note: Individual XHR requests will be handled by the upload function

		setFiles((prev) => prev.filter((f) => f.id !== fileId));
	}, []);

	// Clear all files
	const clearFiles = useCallback(() => {
		// Cancel all uploads (XHR requests will be aborted individually)
		setFiles([]);
		setIsUploading(false);
	}, []);

	// Retry failed upload
	const retryUpload = useCallback(
		async (fileId: string) => {
			const fileState = files.find((f) => f.id === fileId);
			if (!fileState || fileState.status !== "failed") return;

			// Reset file state
			setFiles((prev) =>
				prev.map((f) =>
					f.id === fileId
						? {
								...f,
								status: "pending" as const,
								error: undefined,
								progress: 0,
							}
						: f,
				),
			);

			// Re-validate and upload
			const updatedFileState = files.find((f) => f.id === fileId);
			if (updatedFileState) {
				await validateAndPrepareFile(updatedFileState);
			}
		},
		[files, validateAndPrepareFile],
	);

	// Calculate overall progress
	const overallProgress =
		files.length > 0
			? files.reduce((sum, file) => sum + file.progress, 0) / files.length
			: 0;

	// Calculate statistics
	const stats = {
		total: files.length,
		pending: files.filter((f) => f.status === "pending").length,
		validating: files.filter((f) => f.status === "validating").length,
		uploading: files.filter((f) => f.status === "uploading").length,
		completed: files.filter((f) => f.status === "completed").length,
		failed: files.filter((f) => f.status === "failed").length,
	};

	// Notify progress changes
	useEffect(() => {
		if (onUploadProgress) {
			onUploadProgress(files);
		}
	}, [files, onUploadProgress]);

	return {
		files,
		stats,
		isUploading,
		overallProgress,
		addFiles,
		removeFile,
		clearFiles,
		startUpload, // Deprecated but kept for backward compatibility
		startUploadForFile, // New method for individual file uploads
		retryUpload,
		canUpload: stats.pending > 0 && !isUploading && !!competitionId,
		hasFiles: files.length > 0,
		hasErrors: stats.failed > 0,
		isComplete: stats.total > 0 && stats.completed === stats.total,
	};
}
