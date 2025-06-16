/**
 * File upload hook for managing multiple file uploads with progress tracking
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
	DEFAULT_VALIDATION_RULES,
	type FileValidationRules,
	validateFile,
} from "~/lib/file-validation";
import { compressImage, shouldCompressImage } from "~/lib/image-utils";
import { trpc } from "~/lib/trpc";
import { type UploadProgress, uploadManager } from "~/lib/upload.client";

export interface UploadedFile {
	id: string;
	file: File;
	filePath: string;
	url?: string;
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
	onUploadComplete?: (uploadedFiles: UploadedFile[]) => void;
	onUploadProgress?: (files: FileUploadState[]) => void;
	maxFiles?: number;
	maxFileSize?: number;
	validationRules?: FileValidationRules;
	competitionId?: string;
	autoUpload?: boolean;
	compressionEnabled?: boolean;
}

export function useFileUpload({
	onUploadComplete,
	onUploadProgress,
	maxFiles = 10,
	maxFileSize = 10 * 1024 * 1024,
	validationRules,
	competitionId,
	autoUpload = false,
	compressionEnabled = true,
}: UseFileUploadProps = {}) {
	const [files, setFiles] = useState<FileUploadState[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const uploadId = useRef(0);

	const rules: FileValidationRules = validationRules || {
		...DEFAULT_VALIDATION_RULES,
		maxSize: maxFileSize,
	};

	// tRPC mutations
	const getSignedUrlMutation = trpc.upload.getSignedUrl.useMutation();
	const confirmUploadMutation = trpc.upload.confirmUpload.useMutation();

	// Generate unique ID for each file
	const generateFileId = useCallback(() => {
		return `file-${Date.now()}-${++uploadId.current}`;
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
				await validateAndPrepareFile(fileState.id);
			}

			// Auto-upload if enabled
			if (autoUpload) {
				startUpload();
			}
		},
		[files.length, maxFiles, generateFileId, autoUpload],
	);

	// Validate and prepare a single file
	const validateAndPrepareFile = useCallback(
		async (fileId: string) => {
			setFiles((prev) =>
				prev.map((f) =>
					f.id === fileId ? { ...f, status: "validating" as const } : f,
				),
			);

			try {
				const fileState = files.find((f) => f.id === fileId);
				if (!fileState) return;

				// Validate file
				const validation = await validateFile(fileState.file, rules);
				if (!validation.valid) {
					setFiles((prev) =>
						prev.map((f) =>
							f.id === fileId
								? { ...f, status: "failed" as const, error: validation.error }
								: f,
						),
					);
					return;
				}

				// Check if compression is needed
				let processedFile = fileState.file;
				if (compressionEnabled && (await shouldCompressImage(fileState.file))) {
					try {
						processedFile = await compressImage(fileState.file, {
							quality: 0.8,
							maxWidth: 2048,
							maxHeight: 2048,
						});
					} catch (error) {
						console.warn("Compression failed, using original file:", error);
					}
				}

				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? { ...f, file: processedFile, status: "pending" as const }
							: f,
					),
				);
			} catch (error) {
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
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
		[files, rules, compressionEnabled],
	);

	// Remove file from upload queue
	const removeFile = useCallback((fileId: string) => {
		// Cancel upload if in progress
		uploadManager.cancelUpload(fileId);

		setFiles((prev) => prev.filter((f) => f.id !== fileId));
	}, []);

	// Clear all files
	const clearFiles = useCallback(() => {
		// Cancel all uploads
		uploadManager.cancelAllUploads();
		setFiles([]);
		setIsUploading(false);
	}, []);

	// Start upload process
	const startUpload = useCallback(async () => {
		if (!competitionId) {
			console.error("Competition ID is required for upload");
			return;
		}

		const pendingFiles = files.filter((f) => f.status === "pending");
		if (pendingFiles.length === 0) return;

		setIsUploading(true);

		for (const fileState of pendingFiles) {
			try {
				// Update status to uploading
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileState.id ? { ...f, status: "uploading" as const } : f,
					),
				);

				// Get signed URL
				const signedUrlResult = await getSignedUrlMutation.mutateAsync({
					fileName: fileState.file.name,
					fileSize: fileState.file.size,
					mimeType: fileState.file.type as "image/jpeg" | "image/png",
					competitionId,
				});

				// Track upload progress
				const startTime = Date.now();
				const onProgress = (progress: UploadProgress) => {
					const elapsed = (Date.now() - startTime) / 1000;
					const speed = elapsed > 0 ? progress.loaded / elapsed : 0;

					setFiles((prev) =>
						prev.map((f) =>
							f.id === fileState.id
								? { ...f, progress: progress.percentage, speed }
								: f,
						),
					);
				};

				// Upload file
				const uploadResult = await uploadManager.startUpload(
					fileState.id,
					fileState.file,
					signedUrlResult.signedUrl,
					onProgress,
				);

				if (uploadResult.success) {
					// Confirm upload with server
					try {
						const dimensions = await import("~/lib/image-utils").then((m) =>
							m.getImageDimensions(fileState.file),
						);

						await confirmUploadMutation.mutateAsync({
							photoId: signedUrlResult.photoId,
							filePath: signedUrlResult.filePath,
							width: dimensions.width,
							height: dimensions.height,
						});

						// Mark as completed
						const uploadedFile: UploadedFile = {
							id: signedUrlResult.photoId,
							file: fileState.file,
							filePath: signedUrlResult.filePath,
						};

						setFiles((prev) =>
							prev.map((f) =>
								f.id === fileState.id
									? {
											...f,
											status: "completed" as const,
											progress: 100,
											uploadedFile,
										}
									: f,
							),
						);
					} catch (confirmError) {
						throw new Error(`Upload confirmation failed: ${confirmError}`);
					}
				} else {
					throw new Error(uploadResult.error || "Upload failed");
				}
			} catch (error) {
				setFiles((prev) =>
					prev.map((f) =>
						f.id === fileState.id
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
		}

		setIsUploading(false);

		// Notify completion
		const completedFiles = files
			.filter((f) => f.status === "completed" && f.uploadedFile)
			.map((f) => f.uploadedFile)
			.filter((file): file is UploadedFile => file !== undefined);

		if (completedFiles.length > 0 && onUploadComplete) {
			onUploadComplete(completedFiles);
		}
	}, [
		files,
		competitionId,
		getSignedUrlMutation,
		confirmUploadMutation,
		onUploadComplete,
	]);

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
			await validateAndPrepareFile(fileId);
			if (!isUploading) {
				startUpload();
			}
		},
		[files, isUploading, validateAndPrepareFile, startUpload],
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
		startUpload,
		retryUpload,
		canUpload: stats.pending > 0 && !isUploading && !!competitionId,
		hasFiles: files.length > 0,
		hasErrors: stats.failed > 0,
		isComplete: stats.total > 0 && stats.completed === stats.total,
	};
}
