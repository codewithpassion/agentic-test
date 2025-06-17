/**
 * Individual submission card component
 */

import {
	AlertCircle,
	Calendar,
	Camera,
	CheckCircle,
	Clock,
	Edit,
	Eye,
	MapPin,
	MoreVertical,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";
import type { PhotoWithRelations } from "../../../api/database/schema";

export interface SubmissionCardProps {
	photo: PhotoWithRelations;
	viewMode?: "grid" | "list";
	onEdit: (photoId: string) => void;
	onView: (photoId: string) => void;
	onDelete: (photoId: string) => void;
	className?: string;
}

export function SubmissionCard({
	photo,
	viewMode = "grid",
	onEdit,
	onView,
	onDelete,
	className,
}: SubmissionCardProps) {
	const [showActions, setShowActions] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// tRPC delete mutation
	const deletePhotoMutation = trpc.photos.delete.useMutation();
	const utils = trpc.useUtils();

	// Format date for display
	const formatDate = (date: Date | null): string => {
		if (!date) return "Unknown";
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	// Format file size
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
	};

	// Get status info
	const getStatusInfo = (status: string) => {
		switch (status) {
			case "approved":
				return {
					text: "Approved",
					color: "bg-green-100 text-green-700",
					icon: CheckCircle,
				};
			case "rejected":
				return {
					text: "Rejected",
					color: "bg-red-100 text-red-700",
					icon: AlertCircle,
				};
			case "pending":
				return {
					text: "Under Review",
					color: "bg-orange-100 text-orange-700",
					icon: Clock,
				};
			default:
				return {
					text: status,
					color: "bg-gray-100 text-gray-700",
					icon: AlertCircle,
				};
		}
	};

	// Handle delete confirmation
	const handleDeleteConfirm = async () => {
		setIsDeleting(true);
		try {
			await deletePhotoMutation.mutateAsync({ id: photo.id });
			// Invalidate and refetch submissions
			await utils.photos.getUserSubmissions.invalidate();
			await utils.photos.getSubmissionStats.invalidate();
			setShowDeleteConfirm(false);
			onDelete(photo.id);
		} catch (error) {
			console.error("Failed to delete photo:", error);
			// TODO: Show error toast
		} finally {
			setIsDeleting(false);
		}
	};

	// Check if editing is allowed
	const canEdit =
		photo.competition?.status === "active" && photo.status !== "rejected";

	const statusInfo = getStatusInfo(photo.status);
	const StatusIcon = statusInfo.icon;

	// Generate photo URL using the photo serve API route
	const photoUrl = `/api/photos/serve/${encodeURIComponent(photo.filePath)}`;

	if (viewMode === "list") {
		return (
			<div
				className={cn(
					"bg-white border border-gray-200 rounded-lg p-4",
					className,
				)}
			>
				<div className="flex items-center space-x-4">
					{/* Thumbnail */}
					<div className="flex-shrink-0">
						<img
							src={photoUrl}
							alt={photo.title}
							className="w-16 h-16 object-cover rounded-lg"
							onError={(e) => {
								// Fallback to placeholder
								e.currentTarget.src =
									"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
							}}
						/>
					</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-900 truncate">
									{photo.title}
								</h3>
								<p className="text-sm text-gray-600 mt-1 line-clamp-2">
									{photo.description}
								</p>
								<div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
									<span>{photo.competition?.title || ""}</span>
									<span>•</span>
									<span>{photo.category?.name || ""}</span>
									<span>•</span>
									<span>{formatDate(photo.createdAt)}</span>
								</div>
							</div>

							{/* Status and Actions */}
							<div className="flex items-center space-x-3 ml-4">
								<span
									className={cn(
										"inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
										statusInfo.color,
									)}
								>
									<StatusIcon className="h-3 w-3 mr-1" />
									{statusInfo.text}
								</span>

								{/* Actions */}
								<div className="flex items-center space-x-1">
									<button
										type="button"
										onClick={() => onView(photo.id)}
										className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
										title="View details"
									>
										<Eye className="h-4 w-4" />
									</button>
									{canEdit && (
										<button
											type="button"
											onClick={() => onEdit(photo.id)}
											className="p-1 text-gray-400 hover:text-primary transition-colors"
											title="Edit submission"
										>
											<Edit className="h-4 w-4" />
										</button>
									)}
									<button
										type="button"
										onClick={() => setShowDeleteConfirm(true)}
										className="p-1 text-gray-400 hover:text-red-600 transition-colors"
										title="Delete submission"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Delete Confirmation Modal */}
				{showDeleteConfirm && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Delete Submission
							</h3>
							<p className="text-gray-600 mb-4">
								Are you sure you want to delete "{photo.title}"? This action
								cannot be undone.
							</p>
							<div className="flex justify-end space-x-3">
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(false)}
									disabled={isDeleting}
									className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleDeleteConfirm}
									disabled={isDeleting}
									className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
								>
									{isDeleting ? "Deleting..." : "Delete"}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}

	// Grid view
	return (
		<div
			className={cn(
				"bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow",
				className,
			)}
		>
			{/* Photo */}
			<div className="aspect-square relative">
				<img
					src={photoUrl}
					alt={photo.title}
					className="w-full h-full object-cover"
					onError={(e) => {
						// Fallback to placeholder
						e.currentTarget.src =
							"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
					}}
				/>

				{/* Status Badge */}
				<div className="absolute top-2 left-2">
					<span
						className={cn(
							"inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
							statusInfo.color,
						)}
					>
						<StatusIcon className="h-3 w-3 mr-1" />
						{statusInfo.text}
					</span>
				</div>

				{/* Actions Overlay */}
				<div className="absolute top-2 right-2">
					<div className="relative">
						<button
							type="button"
							onClick={() => setShowActions(!showActions)}
							className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
						>
							<MoreVertical className="h-4 w-4" />
						</button>

						{showActions && (
							<div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
								<button
									type="button"
									onClick={() => {
										onView(photo.id);
										setShowActions(false);
									}}
									className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
								>
									<Eye className="h-4 w-4" />
									<span>View Details</span>
								</button>
								{canEdit && (
									<button
										type="button"
										onClick={() => {
											onEdit(photo.id);
											setShowActions(false);
										}}
										className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
									>
										<Edit className="h-4 w-4" />
										<span>Edit</span>
									</button>
								)}
								<button
									type="button"
									onClick={() => {
										setShowDeleteConfirm(true);
										setShowActions(false);
									}}
									className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
								>
									<Trash2 className="h-4 w-4" />
									<span>Delete</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="p-4">
				<h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
					{photo.title}
				</h3>

				{/* Competition and Category */}
				<p className="text-sm text-gray-600 mb-2">
					{photo.competition?.title || ""} • {photo.category?.name || ""}
				</p>

				{/* Metadata */}
				<div className="space-y-1 text-xs text-gray-500">
					{photo.location && (
						<div className="flex items-center space-x-1">
							<MapPin className="h-3 w-3" />
							<span className="truncate">{photo.location}</span>
						</div>
					)}
					{photo.dateTaken && (
						<div className="flex items-center space-x-1">
							<Calendar className="h-3 w-3" />
							<span>{formatDate(photo.dateTaken)}</span>
						</div>
					)}
					{(photo.cameraMake || photo.cameraModel) && (
						<div className="flex items-center space-x-1">
							<Camera className="h-3 w-3" />
							<span className="truncate">
								{[photo.cameraMake, photo.cameraModel]
									.filter(Boolean)
									.join(" ")}
							</span>
						</div>
					)}
				</div>

				{/* File Info */}
				<div className="mt-3 pt-3 border-t border-gray-100">
					<div className="flex justify-between text-xs text-gray-500">
						<span>{formatFileSize(photo.fileSize)}</span>
						<span>{formatDate(photo.createdAt)}</span>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Delete Submission
						</h3>
						<p className="text-gray-600 mb-4">
							Are you sure you want to delete "{photo.title}"? This action
							cannot be undone.
						</p>
						<div className="flex justify-end space-x-3">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(false)}
								disabled={isDeleting}
								className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDeleteConfirm}
								disabled={isDeleting}
								className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
							>
								{isDeleting ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
