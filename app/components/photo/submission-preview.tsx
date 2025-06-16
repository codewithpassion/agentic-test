/**
 * Submission preview component for final review before submitting
 */

import {
	AlertCircle,
	Calendar,
	Camera,
	Check,
	Edit,
	MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import type { Category, Competition } from "../../../api/database/schema";
import type { PhotoMetadata } from "./metadata-form";

export interface SubmissionPreviewProps {
	photo: File;
	metadata: PhotoMetadata;
	category: Category;
	competition: Competition;
	onEdit: () => void;
	onConfirm: () => void;
	isSubmitting?: boolean;
	className?: string;
}

export function SubmissionPreview({
	photo,
	metadata,
	category,
	competition,
	onEdit,
	onConfirm,
	isSubmitting = false,
	className,
}: SubmissionPreviewProps) {
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [acceptTerms, setAcceptTerms] = useState(false);

	// Generate preview URL for the photo
	useEffect(() => {
		const url = URL.createObjectURL(photo);
		setImageUrl(url);

		return () => {
			URL.revokeObjectURL(url);
		};
	}, [photo]);

	// Format file size for display
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	// Format date for display
	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Check if we have any camera information
	const hasCameraInfo = Boolean(
		metadata.cameraMake ||
			metadata.cameraModel ||
			metadata.lens ||
			metadata.focalLength ||
			metadata.aperture ||
			metadata.shutterSpeed ||
			metadata.iso,
	);

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						Preview Submission
					</h2>
					<p className="text-gray-600">
						Review your photo and details before submitting
					</p>
				</div>
				<button
					type="button"
					onClick={onEdit}
					className="flex items-center space-x-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
				>
					<Edit className="h-4 w-4" />
					<span>Edit Details</span>
				</button>
			</div>

			{/* Competition and Category Context */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-start space-x-3">
					<div className="flex-shrink-0">
						<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
							<Camera className="h-4 w-4 text-white" />
						</div>
					</div>
					<div className="flex-1">
						<h3 className="font-semibold text-blue-900">{competition.title}</h3>
						<p className="text-blue-700 text-sm mt-1">
							Category: {category.name}
						</p>
						{competition.endDate && (
							<p className="text-blue-600 text-xs mt-1">
								Submission deadline:{" "}
								{formatDate(competition.endDate.toISOString())}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Photo Preview */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-gray-900">Photo</h3>
					<div className="relative">
						{imageUrl ? (
							<img
								src={imageUrl}
								alt={metadata.title}
								className="w-full h-auto rounded-lg shadow-lg"
							/>
						) : (
							<div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
								<span className="text-gray-500">Loading preview...</span>
							</div>
						)}
					</div>

					{/* File Information */}
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div>
								<span className="text-gray-600">File name:</span>
								<p className="font-medium truncate">{photo.name}</p>
							</div>
							<div>
								<span className="text-gray-600">File size:</span>
								<p className="font-medium">{formatFileSize(photo.size)}</p>
							</div>
							<div>
								<span className="text-gray-600">Type:</span>
								<p className="font-medium">{photo.type}</p>
							</div>
							<div>
								<span className="text-gray-600">Last modified:</span>
								<p className="font-medium">
									{new Date(photo.lastModified).toLocaleDateString()}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Metadata Details */}
				<div className="space-y-6">
					<h3 className="text-lg font-semibold text-gray-900">Details</h3>

					{/* Basic Information */}
					<div className="space-y-4">
						<div>
							<span className="text-sm font-medium text-gray-600">Title</span>
							<p className="text-gray-900 font-medium">{metadata.title}</p>
						</div>

						<div>
							<span className="text-sm font-medium text-gray-600">
								Description
							</span>
							<p className="text-gray-900 whitespace-pre-wrap">
								{metadata.description}
							</p>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex items-center space-x-2">
								<Calendar className="h-4 w-4 text-gray-500" />
								<div>
									<span className="text-sm font-medium text-gray-600">
										Date Taken
									</span>
									<p className="text-gray-900">
										{formatDate(metadata.dateTaken)}
									</p>
								</div>
							</div>

							<div className="flex items-center space-x-2">
								<MapPin className="h-4 w-4 text-gray-500" />
								<div>
									<span className="text-sm font-medium text-gray-600">
										Location
									</span>
									<p className="text-gray-900">{metadata.location}</p>
								</div>
							</div>
						</div>
					</div>

					{/* Camera Information */}
					{hasCameraInfo && (
						<div className="bg-gray-50 rounded-lg p-4">
							<h4 className="font-medium text-gray-900 mb-3 flex items-center">
								<Camera className="h-4 w-4 mr-2" />
								Camera Information
							</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
								{metadata.cameraMake && (
									<div>
										<span className="text-gray-600">Make:</span>
										<p className="font-medium">{metadata.cameraMake}</p>
									</div>
								)}
								{metadata.cameraModel && (
									<div>
										<span className="text-gray-600">Model:</span>
										<p className="font-medium">{metadata.cameraModel}</p>
									</div>
								)}
								{metadata.lens && (
									<div className="sm:col-span-2">
										<span className="text-gray-600">Lens:</span>
										<p className="font-medium">{metadata.lens}</p>
									</div>
								)}
								{metadata.focalLength && (
									<div>
										<span className="text-gray-600">Focal Length:</span>
										<p className="font-medium">{metadata.focalLength}</p>
									</div>
								)}
								{metadata.aperture && (
									<div>
										<span className="text-gray-600">Aperture:</span>
										<p className="font-medium">{metadata.aperture}</p>
									</div>
								)}
								{metadata.shutterSpeed && (
									<div>
										<span className="text-gray-600">Shutter Speed:</span>
										<p className="font-medium">{metadata.shutterSpeed}</p>
									</div>
								)}
								{metadata.iso && (
									<div>
										<span className="text-gray-600">ISO:</span>
										<p className="font-medium">{metadata.iso}</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Terms and Conditions */}
			<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
				<div className="flex items-start space-x-3">
					<AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
					<div className="flex-1">
						<h4 className="font-medium text-amber-900">Submission Agreement</h4>
						<p className="text-amber-800 text-sm mt-1">
							By submitting this photo, you confirm that:
						</p>
						<ul className="text-amber-800 text-sm mt-2 space-y-1 list-disc list-inside">
							<li>You own the copyright to this image</li>
							<li>The photo meets the competition guidelines</li>
							<li>
								You grant permission for the photo to be displayed publicly
							</li>
							<li>All information provided is accurate</li>
						</ul>

						<label className="flex items-center space-x-2 mt-3">
							<input
								type="checkbox"
								checked={acceptTerms}
								onChange={(e) => setAcceptTerms(e.target.checked)}
								className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
							/>
							<span className="text-sm text-amber-900">
								I agree to the terms and conditions above
							</span>
						</label>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-between items-center pt-6 border-t">
				<button
					type="button"
					onClick={onEdit}
					className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
				>
					Back to Edit
				</button>

				<button
					type="button"
					onClick={onConfirm}
					disabled={!acceptTerms || isSubmitting}
					className={cn(
						"flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors",
						acceptTerms && !isSubmitting
							? "bg-primary text-white hover:bg-primary/90"
							: "bg-gray-300 text-gray-500 cursor-not-allowed",
					)}
				>
					{isSubmitting ? (
						<>
							<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
							<span>Submitting...</span>
						</>
					) : (
						<>
							<Check className="h-4 w-4" />
							<span>Submit Photo</span>
						</>
					)}
				</button>
			</div>
		</div>
	);
}
