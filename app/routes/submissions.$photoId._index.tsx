/**
 * Photo display page - shows photo and details
 */

import { ArrowLeft, Calendar, Camera, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";

export default function PhotoDisplay() {
	const { photoId } = useParams();
	const navigate = useNavigate();

	// Fetch photo details
	const {
		data: photo,
		isLoading,
		error,
	} = trpc.photos.getById.useQuery(
		{ id: photoId || "" },
		{ enabled: !!photoId },
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
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center py-12">
						<p className="text-red-600 mb-4">
							{error?.message || "Photo not found"}
						</p>
						<button
							type="button"
							onClick={() => navigate(-1)}
							className="text-primary hover:text-primary/80"
						>
							← Go back
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Photo URL using the photo serve API route
	const photoUrl = `/api/photos/serve/${encodeURIComponent(photo.filePath)}`;

	return (
		<div className="min-h-screen bg-black">
			{/* Header */}
			<div className="relative z-10 bg-black/50 backdrop-blur-sm">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Back</span>
					</button>
				</div>
			</div>

			{/* Photo Display */}
			<div className="relative">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="relative">
						<img
							src={photoUrl}
							alt={photo.title}
							className="w-full h-auto max-h-[80vh] object-contain mx-auto"
							onError={(e) => {
								// Fallback to placeholder
								e.currentTarget.src =
									"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
							}}
						/>
					</div>
				</div>
			</div>

			{/* Photo Details */}
			<div className="bg-white border-t">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{/* Title and Competition Info */}
					<div className="mb-8">
						<div className="flex items-start justify-between mb-4">
							<div className="flex-1">
								<h1 className="text-3xl font-bold text-gray-900 mb-2">
									{photo.title}
								</h1>
								<p className="text-lg text-gray-600 mb-4">
									{photo.competition?.title || ""} •{" "}
									{photo.category?.name || ""}
								</p>
								{photo.description && (
									<p className="text-gray-700 leading-relaxed">
										{photo.description}
									</p>
								)}
							</div>

							{/* Status Badge */}
							<span
								className={cn(
									"inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ml-4",
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
						</div>
					</div>

					{/* Metadata Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{/* Photo Information */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
								Photo Information
							</h3>
							<div className="space-y-3">
								{photo.dateTaken && (
									<div className="flex items-center space-x-3">
										<Calendar className="h-4 w-4 text-gray-500" />
										<div>
											<span className="text-sm text-gray-500 block">
												Date Taken
											</span>
											<span className="font-medium">
												{new Date(photo.dateTaken).toLocaleDateString()}
											</span>
										</div>
									</div>
								)}
								{photo.location && (
									<div className="flex items-center space-x-3">
										<MapPin className="h-4 w-4 text-gray-500" />
										<div>
											<span className="text-sm text-gray-500 block">
												Location
											</span>
											<span className="font-medium">{photo.location}</span>
										</div>
									</div>
								)}
								<div className="flex items-center space-x-3">
									<div className="h-4 w-4 flex items-center justify-center">
										<div className="h-2 w-2 bg-gray-500 rounded-full" />
									</div>
									<div>
										<span className="text-sm text-gray-500 block">
											Dimensions
										</span>
										<span className="font-medium">
											{photo.width} × {photo.height}
										</span>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<div className="h-4 w-4 flex items-center justify-center">
										<div className="h-2 w-2 bg-gray-500 rounded-full" />
									</div>
									<div>
										<span className="text-sm text-gray-500 block">
											File Size
										</span>
										<span className="font-medium">
											{(photo.fileSize / 1024 / 1024).toFixed(1)} MB
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Camera Equipment */}
						{(photo.cameraMake || photo.cameraModel || photo.lens) && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
									Camera Equipment
								</h3>
								<div className="space-y-3">
									{(photo.cameraMake || photo.cameraModel) && (
										<div className="flex items-center space-x-3">
											<Camera className="h-4 w-4 text-gray-500" />
											<div>
												<span className="text-sm text-gray-500 block">
													Camera
												</span>
												<span className="font-medium">
													{[photo.cameraMake, photo.cameraModel]
														.filter(Boolean)
														.join(" ")}
												</span>
											</div>
										</div>
									)}
									{photo.lens && (
										<div className="flex items-center space-x-3">
											<div className="h-4 w-4 flex items-center justify-center">
												<div className="h-2 w-2 bg-gray-500 rounded-full" />
											</div>
											<div>
												<span className="text-sm text-gray-500 block">
													Lens
												</span>
												<span className="font-medium">{photo.lens}</span>
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Camera Settings */}
						{(photo.focalLength ||
							photo.aperture ||
							photo.shutterSpeed ||
							photo.iso) && (
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
									Camera Settings
								</h3>
								<div className="space-y-3">
									{photo.focalLength && (
										<div className="flex justify-between">
											<span className="text-gray-600">Focal Length</span>
											<span className="font-medium">{photo.focalLength}</span>
										</div>
									)}
									{photo.aperture && (
										<div className="flex justify-between">
											<span className="text-gray-600">Aperture</span>
											<span className="font-medium">{photo.aperture}</span>
										</div>
									)}
									{photo.shutterSpeed && (
										<div className="flex justify-between">
											<span className="text-gray-600">Shutter Speed</span>
											<span className="font-medium">{photo.shutterSpeed}</span>
										</div>
									)}
									{photo.iso && (
										<div className="flex justify-between">
											<span className="text-gray-600">ISO</span>
											<span className="font-medium">{photo.iso}</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Submission Details */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
								Submission Details
							</h3>
							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-gray-600">File Name</span>
									<span className="font-medium text-right break-all">
										{photo.fileName}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Submitted</span>
									<span className="font-medium">
										{photo.createdAt
											? new Date(photo.createdAt).toLocaleDateString()
											: "Unknown"}
									</span>
								</div>
								{photo.competition?.endDate && (
									<div className="flex justify-between">
										<span className="text-gray-600">Competition Ends</span>
										<span className="font-medium">
											{new Date(photo.competition.endDate).toLocaleDateString()}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
