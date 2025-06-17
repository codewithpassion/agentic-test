/**
 * Multi-photo submission page for a specific competition
 */

import { ArrowLeft, Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import type { CategoryWithSubmissionInfo } from "~/components/photo/category-select";
import {
	PhotoMetadataCard,
	type PhotoMetadataFormData,
} from "~/components/photo/photo-metadata-card";
import { DetailedUploadProgress } from "~/components/photo/upload-progress";
import { UploadZone } from "~/components/photo/upload-zone";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useAuth } from "~/hooks/use-auth";
import { useFileUpload } from "~/hooks/use-file-upload";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";

interface PhotoSubmissionData {
	id: string;
	file: File;
	metadata: PhotoMetadataFormData | null;
}

export default function SubmitCompetition() {
	const { competitionId } = useParams();
	const navigate = useNavigate();

	const [photoSubmissions, setPhotoSubmissions] = useState<
		PhotoSubmissionData[]
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Get competition and categories data
	const {
		data: competitionData,
		isLoading,
		error,
	} = trpc.competitions.getCategoriesWithStats.useQuery(
		{ competitionId: competitionId ?? "" },
		{ enabled: !!competitionId },
	);

	// Get user session
	const { user } = useAuth();

	useEffect(() => {
		console.log("User session:", user);
	}, [user]);

	// File upload hook
	const {
		addFiles,
		files,
		clearFiles,
		removeFile,
		startUpload,
		startUploadForFile,
	} = useFileUpload({
		competitionId: competitionId ?? "",
		maxFiles: 10,
	});

	// Sync photoSubmissions with files state
	useEffect(() => {
		// Add new files that don't have corresponding submissions yet
		setPhotoSubmissions((prev) => {
			const newSubmissions: PhotoSubmissionData[] = [];

			for (const fileState of files) {
				const existingSubmission = prev.find((s) => s.id === fileState.id);
				if (!existingSubmission) {
					newSubmissions.push({
						id: fileState.id,
						file: fileState.file,
						metadata: null,
					});
				}
			}

			// Add new submissions and remove ones that no longer have files
			const updated = [...prev, ...newSubmissions].filter((submission) =>
				files.some((fileState) => fileState.id === submission.id),
			);

			if (newSubmissions.length > 0) {
				console.log("Adding new submissions:", newSubmissions.length);
			}

			return updated;
		});
	}, [files]);

	// tRPC mutations
	const submitBatchMutation = trpc.photos.submitBatch.useMutation();

	// Handle file selection
	const handleFilesSelected = useCallback(
		async (newFiles: File[]) => {
			console.log(
				"handleFilesSelected called with:",
				newFiles.map((f) => f.name),
			);
			if (newFiles.length > 0) {
				// Add files to upload queue first
				await addFiles(newFiles);
			}
		},
		[addFiles],
	);

	// Handle metadata changes for a specific photo
	const handleMetadataChange = useCallback(
		(fileIndex: number, metadata: PhotoMetadataFormData | null) => {
			// Update the submission state only - no automatic upload
			setPhotoSubmissions((prev) => {
				const updated = prev.map((submission, index) =>
					index === fileIndex ? { ...submission, metadata } : submission,
				);
				return updated;
			});
		},
		[],
	);

	// Handle photo removal
	const handleRemovePhoto = useCallback(
		(fileIndex: number) => {
			const submission = photoSubmissions[fileIndex];
			if (submission) {
				// Remove from files array using ID (this will stop upload if in progress)
				removeFile(submission.id);

				// Remove from submissions
				setPhotoSubmissions((prev) =>
					prev.filter((_, index) => index !== fileIndex),
				);
			}
		},
		[photoSubmissions, removeFile],
	);

	// Handle batch submission
	const handleSubmitBatch = useCallback(async () => {
		if (!competitionId || !competitionData || !user?.id) return;

		// Filter submissions that have complete metadata
		const submissionsWithMetadata = photoSubmissions.filter(
			(submission) => submission.metadata,
		);

		if (submissionsWithMetadata.length === 0) {
			alert("Please complete all photo forms before submitting.");
			return;
		}

		setIsSubmitting(true);
		try {
			// First, upload all photos that haven't been uploaded yet
			const uploadPromises: Promise<void>[] = [];

			for (const submission of submissionsWithMetadata) {
				const fileState = files.find((f) => f.id === submission.id);

				// Only upload if file is pending (not already uploaded)
				if (
					fileState &&
					fileState.status === "pending" &&
					submission.metadata
				) {
					const uploadPromise = startUploadForFile(
						fileState.id,
						submission.file,
						user.id,
						submission.metadata.categoryId,
						{
							...submission.metadata,
							dateTaken: new Date(submission.metadata.dateTaken),
							focalLength: submission.metadata.focalLength?.trim()
								? Number.parseFloat(submission.metadata.focalLength)
								: undefined,
							iso: submission.metadata.iso?.trim()
								? Number.parseInt(submission.metadata.iso)
								: undefined,
						},
					);
					uploadPromises.push(uploadPromise);
				}
			}

			// Wait for all uploads to complete
			if (uploadPromises.length > 0) {
				await Promise.all(uploadPromises);

				// Wait a bit for the upload states to update
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			// Now check which submissions have successfully uploaded files
			const validSubmissions = photoSubmissions.filter((submission) => {
				const uploadedFile = files.find(
					(f) =>
						f.id === submission.id &&
						f.status === "completed" &&
						f.uploadedFile,
				);
				return submission.metadata && uploadedFile;
			});

			if (validSubmissions.length === 0) {
				alert("Photo uploads failed. Please try again.");
				return;
			}

			// Prepare batch submission data for photos that uploaded successfully
			const batchData = {
				competitionId,
				photos: validSubmissions.map((submission) => {
					const uploadedFile = files.find(
						(f) =>
							f.id === submission.id &&
							f.status === "completed" &&
							f.uploadedFile,
					)?.uploadedFile;

					if (!uploadedFile || !submission.metadata) {
						throw new Error("Invalid submission data");
					}

					return {
						categoryId: submission.metadata.categoryId,
						title: submission.metadata.title,
						description: submission.metadata.description,
						dateTaken: new Date(submission.metadata.dateTaken),
						location: submission.metadata.location,
						cameraMake: submission.metadata.cameraMake,
						cameraModel: submission.metadata.cameraModel,
						lens: submission.metadata.lens,
						focalLength: submission.metadata.focalLength,
						aperture: submission.metadata.aperture,
						shutterSpeed: submission.metadata.shutterSpeed,
						iso: submission.metadata.iso,
						filePath: uploadedFile.filePath,
						fileName: submission.file.name,
						fileSize: submission.file.size,
						mimeType: submission.file.type as "image/jpeg" | "image/png",
						width: 1920, // TODO: Get from image processing
						height: 1080, // TODO: Get from image processing
					};
				}),
			};

			const result = await submitBatchMutation.mutateAsync(batchData);

			// Show results
			if (result.errors.length > 0) {
				const errorMessages = result.errors.map(
					(err) => `Photo ${err.index + 1}: ${err.error}`,
				);
				alert(`Some photos failed to submit:\n${errorMessages.join("\n")}`);
			}

			if (result.success.length > 0) {
				// Clear submissions and redirect to success page
				setPhotoSubmissions([]);
				clearFiles();
				navigate(`/my-submissions?success=${result.success.length}`);
			}
		} catch (error) {
			console.error("Batch submission failed:", error);
			alert("Submission failed. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}, [
		competitionId,
		competitionData,
		user?.id,
		photoSubmissions,
		files,
		startUploadForFile,
		submitBatchMutation,
		clearFiles,
		navigate,
	]);

	// Calculate submission stats
	const completedMetadata = photoSubmissions.filter((s) => s.metadata).length;
	const completedUploads = photoSubmissions.filter((submission) => {
		const fileUpload = files.find((f) => f.id === submission.id);
		return fileUpload?.status === "completed";
	}).length;
	// Ready to submit = photos with complete metadata (uploads will happen on submit)
	const readyToSubmit = photoSubmissions.filter(
		(submission) => submission.metadata,
	).length;

	// Debug logging (only log when values change)
	const statsRef = useRef<string>("");
	const currentStats = `${photoSubmissions.length}-${completedMetadata}-${completedUploads}-${readyToSubmit}-${files.length}`;
	if (statsRef.current !== currentStats) {
		statsRef.current = currentStats;
	}

	if (!competitionId) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600">Competition ID is required</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<LoadingSpinner className="h-8 w-8" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">Failed to load competition data</p>
					<p className="text-gray-600">{error.message}</p>
				</div>
			</div>
		);
	}

	if (!competitionData) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Competition not found</p>
				</div>
			</div>
		);
	}

	const { competition, categories } = competitionData;

	// Transform categories to include submission info
	const categoriesWithSubmissionInfo: CategoryWithSubmissionInfo[] =
		categories.map((cat) => ({
			...cat,
			userSubmissionCount: cat.userSubmissionCount,
			remainingSlots: cat.remainingSlots,
			canSubmit: cat.canSubmit,
		}));

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<button
						type="button"
						onClick={() => navigate("/submit")}
						className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Back to Competitions</span>
					</button>

					<div className="bg-white border border-gray-200 rounded-lg p-6">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Submit Photos to {competition.title}
						</h1>
						<p className="text-gray-600 mb-4">{competition.description}</p>

						{/* Submission stats */}
						{photoSubmissions.length > 0 && (
							<div className="flex items-center space-x-6 text-sm text-gray-600">
								<span>{photoSubmissions.length} photos selected</span>
								<span>{completedUploads} uploaded</span>
								<span>{completedMetadata} with metadata</span>
								<span className="font-medium text-primary">
									{readyToSubmit} ready to submit
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Upload Zone */}
				<div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold text-gray-900">
							Upload Photos
						</h2>
						<span className="text-sm text-gray-500">
							{categories.length} categor{categories.length !== 1 ? "ies" : "y"}{" "}
							available
						</span>
					</div>

					<UploadZone
						onFilesSelected={handleFilesSelected}
						maxFiles={10 - photoSubmissions.length}
						multiple={true}
						acceptedTypes={["image/jpeg", "image/png"]}
						maxFileSize={10 * 1024 * 1024} // 10MB
						disabled={photoSubmissions.length >= 10}
					/>

					{photoSubmissions.length >= 10 && (
						<p className="text-sm text-amber-600 mt-2">
							Maximum of 10 photos per submission. Remove some photos to add
							more.
						</p>
					)}
				</div>

				{/* Upload Progress Display */}
				{files.length > 0 && (
					<DetailedUploadProgress
						uploads={files.map((file) => ({
							id: file.id,
							fileName: file.file.name,
							fileSize: file.file.size,
							progress: file.progress,
							status: file.status === "validating" ? "pending" : file.status,
							error: file.error,
							speed: file.speed,
						}))}
						className="mb-6"
					/>
				)}

				{/* Photo Metadata Forms */}
				{photoSubmissions.length > 0 && (
					<div className="space-y-6 mb-6">
						<h2 className="text-xl font-semibold text-gray-900">
							Photo Details ({photoSubmissions.length})
						</h2>

						{photoSubmissions.map((submission, index) => {
							const fileUpload = files.find((f) => f.id === submission.id);

							return (
								<PhotoMetadataCard
									key={submission.id}
									file={submission.file}
									categories={categoriesWithSubmissionInfo}
									initialData={submission.metadata || undefined}
									onMetadataChange={(metadata) =>
										handleMetadataChange(index, metadata)
									}
									onRemove={() => handleRemovePhoto(index)}
									uploadProgress={fileUpload?.progress || 0}
									uploadError={fileUpload?.error}
									isUploading={fileUpload?.status === "uploading"}
									isCompleted={fileUpload?.status === "completed"}
								/>
							);
						})}
					</div>
				)}

				{/* Submit Button */}
				{photoSubmissions.length > 0 && (
					<div className="bg-white border border-gray-200 rounded-lg p-6">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-medium text-gray-900">Ready to Submit</h3>
								<p className="text-sm text-gray-600">
									{readyToSubmit} of {photoSubmissions.length} photos ready
								</p>
							</div>

							<button
								type="button"
								onClick={handleSubmitBatch}
								disabled={isSubmitting || readyToSubmit === 0}
								className={cn(
									"flex items-center space-x-2 px-6 py-3 rounded-lg font-medium",
									readyToSubmit > 0
										? "bg-primary text-white hover:bg-primary/90"
										: "bg-gray-100 text-gray-400 cursor-not-allowed",
									isSubmitting && "animate-pulse",
								)}
							>
								<Upload className="h-4 w-4" />
								<span>
									{isSubmitting
										? "Uploading & Submitting..."
										: `Upload & Submit ${readyToSubmit} Photo${readyToSubmit !== 1 ? "s" : ""}`}
								</span>
							</button>
						</div>
					</div>
				)}

				{/* No photos state */}
				{photoSubmissions.length === 0 && (
					<div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
						<Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							No Photos Selected
						</h3>
						<p className="text-gray-600">
							Upload photos using the form above to get started.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
