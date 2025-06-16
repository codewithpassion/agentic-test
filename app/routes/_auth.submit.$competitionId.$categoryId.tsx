/**
 * Photo upload and submission page
 */

import { ArrowLeft, Eye, FileText, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ImagePreviewList } from "~/components/photo/image-preview";
import {
	MetadataForm,
	type PhotoMetadata,
} from "~/components/photo/metadata-form";
import { SubmissionPreview } from "~/components/photo/submission-preview";
import { UploadZone } from "~/components/photo/upload-zone";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { useFileUpload } from "~/hooks/use-file-upload";
import { useSubmissionDraft } from "~/hooks/use-submission-draft";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";

// Submission flow steps
type SubmissionStep = "upload" | "metadata" | "preview";

// Removed loader - using tRPC queries instead

export default function SubmitPhoto() {
	const { competitionId, categoryId } = useParams();
	const navigate = useNavigate();

	// Get submission context data
	const {
		data: submissionData,
		isLoading,
		error,
	} = trpc.photos.getSubmissionContext.useQuery(
		{ competitionId: competitionId ?? "", categoryId: categoryId ?? "" },
		{ enabled: !!competitionId && !!categoryId },
	);

	if (!competitionId || !categoryId) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600">
						Competition ID and Category ID are required
					</p>
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
					<p className="text-red-600 mb-4">Failed to load submission data</p>
					<p className="text-gray-600">{error.message}</p>
				</div>
			</div>
		);
	}

	if (!submissionData) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Submission data not found</p>
				</div>
			</div>
		);
	}

	const { competition, category, remainingSlots } = submissionData;

	// Submission flow state
	const [currentStep, setCurrentStep] = useState<SubmissionStep>("upload");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Draft management
	const { draftData, saveDraft, clearDraft } = useSubmissionDraft({
		competitionId: competition.id,
		categoryId: category.id,
	});

	// File upload hook
	const { addFiles, files, stats, isUploading, clearFiles } = useFileUpload({
		competitionId: competition.id,
		maxFiles: 1,
		autoUpload: false,
	});

	// tRPC mutations
	const submitPhotoMutation = trpc.photos.submit.useMutation();

	// Handle file selection
	const handleFilesSelected = useCallback(
		(newFiles: File[]) => {
			if (newFiles.length > 0) {
				setSelectedFile(newFiles[0]);
				addFiles(newFiles);
			}
		},
		[addFiles],
	);

	// Handle metadata form submission
	const handleMetadataSubmit = useCallback((formData: PhotoMetadata) => {
		setMetadata(formData);
		setCurrentStep("preview");
	}, []);

	// Handle metadata form draft save
	const handleMetadataDraft = useCallback(
		(formData: PhotoMetadata) => {
			saveDraft(formData);
		},
		[saveDraft],
	);

	// Handle final submission
	const handleFinalSubmission = useCallback(async () => {
		if (!selectedFile || !metadata) return;

		setIsSubmitting(true);
		try {
			// First upload the file using the upload hook
			await addFiles([selectedFile]);

			// Get the uploaded file info (this would need to be implemented in the hook)
			const uploadedFiles = files.filter((f) => f.status === "completed");
			if (uploadedFiles.length === 0) {
				throw new Error("File upload failed");
			}

			const uploadedFile = uploadedFiles[0];

			// Submit photo metadata to database
			await submitPhotoMutation.mutateAsync({
				competitionId,
				categoryId,
				filePath: uploadedFile.uploadedFile?.filePath || "",
				fileName: selectedFile.name,
				fileSize: selectedFile.size,
				mimeType: selectedFile.type as "image/jpeg" | "image/png",
				width: 1920, // This should come from image processing
				height: 1080, // This should come from image processing
				...metadata,
				dateTaken: new Date(metadata.dateTaken),
			});

			// Clear draft and redirect to success
			clearDraft();
			navigate(`/submit/${competitionId}?success=true`);
		} catch (error) {
			console.error("Submission failed:", error);
			// Handle error (show toast, etc.)
		} finally {
			setIsSubmitting(false);
		}
	}, [
		selectedFile,
		metadata,
		addFiles,
		files,
		submitPhotoMutation,
		competitionId,
		categoryId,
		clearDraft,
		navigate,
	]);

	// Navigation handlers
	const handleBackToUpload = () => {
		setCurrentStep("upload");
	};

	const handleBackToMetadata = () => {
		setCurrentStep("metadata");
	};

	const handleContinueToMetadata = () => {
		if (selectedFile) {
			setCurrentStep("metadata");
		}
	};

	// Step indicator component
	const StepIndicator = () => (
		<div className="flex items-center space-x-4 mb-8">
			{[
				{ key: "upload", label: "Upload Photo", icon: Upload },
				{ key: "metadata", label: "Add Details", icon: FileText },
				{ key: "preview", label: "Preview & Submit", icon: Eye },
			].map(({ key, label, icon: Icon }, index) => {
				const isActive = currentStep === key;
				const isCompleted =
					(key === "upload" && selectedFile) ||
					(key === "metadata" && metadata) ||
					(key === "preview" && false); // Never completed until submission

				return (
					<div key={key} className="flex items-center">
						<div
							className={cn(
								"flex items-center justify-center w-8 h-8 rounded-full border-2",
								isActive
									? "border-primary bg-primary text-white"
									: isCompleted
										? "border-green-500 bg-green-500 text-white"
										: "border-gray-300 bg-white text-gray-400",
							)}
						>
							<Icon className="h-4 w-4" />
						</div>
						<span
							className={cn(
								"ml-2 text-sm font-medium",
								isActive
									? "text-primary"
									: isCompleted
										? "text-green-600"
										: "text-gray-500",
							)}
						>
							{label}
						</span>
						{index < 2 && (
							<div
								className={cn(
									"w-8 h-0.5 mx-4",
									isCompleted ? "bg-green-500" : "bg-gray-300",
								)}
							/>
						)}
					</div>
				);
			})}
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<button
						type="button"
						onClick={() => navigate(`/submit/${competition.id}`)}
						className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Back to Categories</span>
					</button>

					<div className="bg-white border border-gray-200 rounded-lg p-6">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Submit to {category.name}
						</h1>
						<p className="text-gray-600 mb-4">{competition.title}</p>
						<div className="flex items-center space-x-6 text-sm text-gray-600">
							<span>
								<strong>{remainingSlots}</strong> submission
								{remainingSlots !== 1 ? "s" : ""} remaining
							</span>
							<span>
								Max <strong>{category.maxPhotosPerUser}</strong> photos per user
							</span>
						</div>
					</div>
				</div>

				{/* Step Indicator */}
				<StepIndicator />

				{/* Step Content */}
				<div className="bg-white border border-gray-200 rounded-lg p-6">
					{currentStep === "upload" && (
						<div className="space-y-6">
							<div>
								<h2 className="text-xl font-semibold text-gray-900 mb-2">
									Upload Your Photo
								</h2>
								<p className="text-gray-600">
									Select a high-quality photo that represents your best work for
									this category.
								</p>
							</div>

							<UploadZone
								onFilesSelected={handleFilesSelected}
								maxFiles={1}
								multiple={false}
								acceptedTypes={["image/jpeg", "image/png"]}
								maxFileSize={10 * 1024 * 1024} // 10MB
							/>

							{files.length > 0 && (
								<div className="space-y-4">
									<ImagePreviewList
										files={files.map((f) => ({
											file: f.file,
											uploadProgress: f.progress,
											error: f.error,
											isUploading: f.status === "uploading",
											isCompleted: f.status === "completed",
										}))}
										onRemoveFile={(index) => {
											setSelectedFile(null);
											clearFiles();
										}}
									/>

									{selectedFile && (
										<div className="flex justify-end">
											<button
												type="button"
												onClick={handleContinueToMetadata}
												className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
											>
												Continue to Details
											</button>
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{currentStep === "metadata" && selectedFile && (
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-xl font-semibold text-gray-900 mb-2">
										Add Photo Details
									</h2>
									<p className="text-gray-600">
										Provide information about your photo to help judges and
										viewers understand your work.
									</p>
								</div>
								<button
									type="button"
									onClick={handleBackToUpload}
									className="text-primary hover:text-primary/80"
								>
									Change Photo
								</button>
							</div>

							<MetadataForm
								initialData={draftData || undefined}
								onSubmit={handleMetadataSubmit}
								onSaveDraft={handleMetadataDraft}
								isSubmitting={false}
							/>
						</div>
					)}

					{currentStep === "preview" && selectedFile && metadata && (
						<SubmissionPreview
							photo={selectedFile}
							metadata={metadata}
							category={category}
							competition={competition}
							onEdit={handleBackToMetadata}
							onConfirm={handleFinalSubmission}
							isSubmitting={isSubmitting}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
