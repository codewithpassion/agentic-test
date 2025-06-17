import { Clock } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { PhotoModerationCard } from "./photo-moderation-card";

interface Photo {
	id: string;
	title: string;
	status: "pending" | "approved" | "rejected";
	createdAt: Date;
	filePath?: string;
	user?: {
		id: string;
		name?: string;
	};
	competition?: {
		id: string;
		title: string;
	};
	category?: {
		id: string;
		name: string;
	};
	moderatedAt?: Date;
	moderatedBy?: string;
	rejectionReason?: string;
}

interface PhotoModerationGridProps {
	photos: Photo[];
	isLoading?: boolean;
	emptyMessage?: string;
	emptyIcon?: React.ReactNode;
	onPhotoClick?: (photoId: string) => void;
	onModeratePhoto?: (
		photoId: string,
		action: "approve" | "reject",
		reason?: string,
	) => void;
	showModerationActions?: boolean;
}

export function PhotoModerationGrid({
	photos,
	isLoading = false,
	emptyMessage = "No photos found",
	emptyIcon,
	onPhotoClick,
	onModeratePhoto,
	showModerationActions = true,
}: PhotoModerationGridProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{Array.from({ length: 8 }).map((_, index) => (
					<Card
						// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items don't change order
						key={index}
						className="overflow-hidden animate-pulse"
					>
						<div className="aspect-video bg-gray-200" />
						<CardContent className="p-4 space-y-2">
							<div className="h-4 bg-gray-200 rounded" />
							<div className="h-3 bg-gray-200 rounded w-3/4" />
							<div className="h-3 bg-gray-200 rounded w-1/2" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (photos.length === 0) {
		return (
			<Card>
				<CardContent className="p-12">
					<div className="text-center text-gray-500">
						{emptyIcon || (
							<Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
						)}
						<h3 className="text-lg font-medium mb-2">No photos found</h3>
						<p>{emptyMessage}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{photos.map((photo) => (
				<PhotoModerationCard
					key={photo.id}
					photo={photo}
					onClick={onPhotoClick}
					onModerate={onModeratePhoto}
					showModerationActions={showModerationActions}
				/>
			))}
		</div>
	);
}
