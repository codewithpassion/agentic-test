/**
 * Submissions grid component with grid/list view modes
 */

import { useNavigate } from "react-router";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { cn } from "~/lib/utils";
import type { PhotoWithRelations } from "../../../api/database/schema";
import { SubmissionCard } from "./submission-card";

export interface SubmissionsGridProps {
	photos: PhotoWithRelations[];
	loading?: boolean;
	viewMode?: "grid" | "list";
	totalCount?: number;
	className?: string;
}

export function SubmissionsGrid({
	photos,
	loading = false,
	viewMode = "grid",
	totalCount = 0,
	className,
}: SubmissionsGridProps) {
	const navigate = useNavigate();

	// Handle photo actions
	const handleEdit = (photoId: string) => {
		navigate(`/submissions/${photoId}/edit`);
	};

	const handleView = (photoId: string) => {
		navigate(`/submissions/${photoId}`);
	};

	const handleDelete = (photoId: string) => {
		// This will be handled by the SubmissionCard component
		// which will show a confirmation dialog
	};

	// Loading state
	if (loading) {
		return (
			<div className={cn("flex items-center justify-center py-12", className)}>
				<LoadingSpinner className="h-8 w-8" />
			</div>
		);
	}

	// Empty state
	if (photos.length === 0) {
		return null; // Handled by parent component
	}

	return (
		<div className={cn("space-y-6", className)}>
			{/* Results Summary */}
			<div className="flex items-center justify-between">
				<p className="text-sm text-gray-600">
					Showing {photos.length} of {totalCount} submission
					{totalCount !== 1 ? "s" : ""}
				</p>
			</div>

			{/* Grid/List Container */}
			<div
				className={cn(
					"transition-all duration-200",
					viewMode === "grid"
						? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
						: "space-y-4",
				)}
			>
				{photos.map((photo) => (
					<SubmissionCard
						key={photo.id}
						photo={photo}
						viewMode={viewMode}
						onEdit={handleEdit}
						onView={handleView}
						onDelete={handleDelete}
					/>
				))}
			</div>

			{/* Load More / Pagination Placeholder */}
			{photos.length < totalCount && (
				<div className="text-center py-6">
					<button
						type="button"
						className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
						onClick={() => {
							// TODO: Implement pagination or load more
							console.log("Load more photos");
						}}
					>
						Load More Submissions
					</button>
				</div>
			)}
		</div>
	);
}
