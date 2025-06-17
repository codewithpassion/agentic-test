/**
 * Edit submission page
 */

import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
	MetadataForm,
	type PhotoMetadata,
} from "~/components/photo/metadata-form";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";

export default function EditSubmission() {
	const { photoId } = useParams();
	const navigate = useNavigate();
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);

	// Fetch photo details
	const {
		data: photo,
		isLoading,
		error,
	} = trpc.photos.getById.useQuery(
		{ id: photoId || "" },
		{ enabled: !!photoId },
	);

	// Update mutation
	const updatePhotoMutation = trpc.photos.update.useMutation();
	const utils = trpc.useUtils();

	// Handle form submission
	const handleMetadataSubmit = useCallback(
		async (metadata: PhotoMetadata) => {
			if (!photoId) return;

			setIsSaving(true);
			setSaveError(null);
			setSaveSuccess(false);

			try {
				await updatePhotoMutation.mutateAsync({
					id: photoId,
					...metadata,
					dateTaken: new Date(metadata.dateTaken),
				});

				// Invalidate caches
				await utils.photos.getById.invalidate({ id: photoId });
				await utils.photos.getUserSubmissions.invalidate();

				setSaveSuccess(true);
				setTimeout(() => setSaveSuccess(false), 3000);
			} catch (error) {
				console.error("Failed to update photo:", error);
				setSaveError(
					error instanceof Error ? error.message : "Failed to save changes",
				);
			} finally {
				setIsSaving(false);
			}
		},
		[photoId, updatePhotoMutation, utils],
	);

	// Handle not found
	if (!photoId) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center py-12">
						<p className="text-red-600">Photo ID is required</p>
					</div>
				</div>
			</div>
		);
	}

	// Loading state
	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-center py-12">
						<LoadingSpinner className="h-8 w-8" />
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (error || !photo) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center py-12">
						<p className="text-red-600 mb-4">
							{error?.message || "Photo not found"}
						</p>
						<button
							type="button"
							onClick={() => navigate("/my-submissions")}
							className="text-primary hover:text-primary/80"
						>
							← Back to submissions
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Check if editing is allowed
	const canEdit =
		photo.competition?.status === "active" && photo.status !== "rejected";

	if (!canEdit) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center py-12">
						<AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							Cannot Edit Submission
						</h3>
						<p className="text-gray-600 mb-6">
							{photo.status === "rejected"
								? "Rejected submissions cannot be edited."
								: "This competition has ended and submissions can no longer be edited."}
						</p>
						<button
							type="button"
							onClick={() => navigate("/my-submissions")}
							className="text-primary hover:text-primary/80"
						>
							← Back to submissions
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Prepare initial data for form
	const initialData: PhotoMetadata = {
		title: photo.title,
		description: photo.description,
		dateTaken: photo.dateTaken?.toISOString().split("T")[0] || "",
		location: photo.location,
		cameraMake: photo.cameraMake || "",
		cameraModel: photo.cameraModel || "",
		lens: photo.lens || "",
		focalLength: photo.focalLength || "",
		aperture: photo.aperture || "",
		shutterSpeed: photo.shutterSpeed || "",
		iso: photo.iso || "",
	};

	// Photo URL using the photo serve API route
	const photoUrl = `/api/photos/serve/${encodeURIComponent(photo.filePath)}`;

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<button
						type="button"
						onClick={() => navigate("/my-submissions")}
						className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Back to Submissions</span>
					</button>

					<div className="bg-white border border-gray-200 rounded-lg p-6">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h1 className="text-2xl font-bold text-gray-900 mb-2">
									Edit Submission
								</h1>
								<p className="text-gray-600 mb-4">
									{photo.competition?.title || ""} •{" "}
									{photo.category?.name || ""}
								</p>

								{/* Status and warnings */}
								<div className="flex items-center space-x-4">
									<span
										className={cn(
											"inline-flex items-center px-3 py-1 text-sm font-medium rounded-full",
											photo.status === "approved"
												? "bg-green-100 text-green-700"
												: photo.status === "rejected"
													? "bg-red-100 text-red-700"
													: "bg-orange-100 text-orange-700",
										)}
									>
										{photo.status === "approved"
											? "Approved"
											: photo.status === "rejected"
												? "Rejected"
												: "Under Review"}
									</span>

									{photo.competition?.endDate && (
										<span className="text-sm text-gray-500">
											Competition ends:{" "}
											{new Date(photo.competition.endDate).toLocaleDateString()}
										</span>
									)}
								</div>
							</div>

							{/* Save Status */}
							{saveSuccess && (
								<div className="flex items-center space-x-2 text-green-600">
									<Save className="h-4 w-4" />
									<span className="text-sm font-medium">Changes saved!</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Error Display */}
				{saveError && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
						<div className="flex items-center space-x-2">
							<AlertCircle className="h-5 w-5 text-red-600" />
							<p className="text-red-700">{saveError}</p>
						</div>
					</div>
				)}

				{/* Main Content */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Photo Display */}
					<div className="space-y-4">
						<h2 className="text-lg font-semibold text-gray-900">
							Current Photo
						</h2>

						<div className="bg-white border border-gray-200 rounded-lg p-4">
							<div className="aspect-square relative mb-4">
								<img
									src={photoUrl}
									alt={photo.title}
									className="w-full h-full object-cover rounded-lg"
									onError={(e) => {
										// Fallback to placeholder
										e.currentTarget.src =
											"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
									}}
								/>
							</div>

							{/* File Info */}
							<div className="space-y-2 text-sm text-gray-600">
								<div className="flex justify-between">
									<span>File name:</span>
									<span className="font-medium">{photo.fileName}</span>
								</div>
								<div className="flex justify-between">
									<span>File size:</span>
									<span className="font-medium">
										{(photo.fileSize / 1024 / 1024).toFixed(1)} MB
									</span>
								</div>
								<div className="flex justify-between">
									<span>Dimensions:</span>
									<span className="font-medium">
										{photo.width} × {photo.height}
									</span>
								</div>
								<div className="flex justify-between">
									<span>Submitted:</span>
									<span className="font-medium">
										{photo.createdAt
											? new Date(photo.createdAt).toLocaleDateString()
											: "Unknown"}
									</span>
								</div>
							</div>
						</div>

						{/* Edit Note */}
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-blue-700 text-sm">
								<strong>Note:</strong> You can edit the photo details and
								metadata, but you cannot change the photo file itself. To submit
								a different photo, you'll need to delete this submission and
								create a new one.
							</p>
						</div>
					</div>

					{/* Metadata Form */}
					<div className="space-y-4">
						<h2 className="text-lg font-semibold text-gray-900">
							Photo Details
						</h2>

						<div className="bg-white border border-gray-200 rounded-lg p-6">
							<MetadataForm
								initialData={initialData}
								onSubmit={handleMetadataSubmit}
								isSubmitting={isSaving}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
