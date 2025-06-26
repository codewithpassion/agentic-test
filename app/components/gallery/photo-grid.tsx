import { Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "~/lib/utils";
import type { PhotoWithRelations } from "../../../api/database/schema";
import { LazyImage } from "./lazy-image";

// Extend PhotoWithRelations to include vote data
type PhotoWithVotes = PhotoWithRelations & {
	voteCount?: number;
	hasVoted?: boolean;
};

interface PhotoGridProps {
	photos: PhotoWithVotes[];
	columns?: 2 | 3 | 4 | 5;
	layout?: "grid" | "masonry";
	aspectRatio?: "square" | "portrait" | "landscape" | "auto";
	gap?: "sm" | "md" | "lg";
	showMetadata?: boolean;
	onPhotoClick?: (photo: PhotoWithVotes, index: number) => void;
	loading?: boolean;
	className?: string;
}

export function PhotoGrid({
	photos,
	columns = 3,
	layout = "grid",
	aspectRatio = "auto",
	gap = "md",
	showMetadata = false,
	onPhotoClick,
	loading = false,
	className,
}: PhotoGridProps) {
	const [loadedCount, setLoadedCount] = useState(0);

	const columnClasses = {
		2: "grid-cols-1 md:grid-cols-2",
		3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
		5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
	};

	const gapClasses = {
		sm: "gap-2",
		md: "gap-4",
		lg: "gap-6",
	};

	const photoColumns = useMemo(() => {
		if (layout !== "masonry") return [photos];

		const cols: PhotoWithVotes[][] = Array.from({ length: columns }, () => []);
		photos.forEach((photo, index) => {
			cols[index % columns].push(photo);
		});
		return cols;
	}, [photos, columns, layout]);

	const handlePhotoLoad = () => {
		setLoadedCount((prev) => prev + 1);
	};

	if (loading) {
		return (
			<div
				className={cn(
					"grid",
					columnClasses[columns],
					gapClasses[gap],
					className,
				)}
			>
				{Array.from({ length: 12 }).map((_, index) => (
					<div
						/* biome-ignore lint/suspicious/noArrayIndexKey: This is a loading placeholder, not dynamic content */
						key={`loading-${index}`}
						className="animate-pulse bg-gray-200 rounded-lg aspect-square"
					/>
				))}
			</div>
		);
	}

	if (photos.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="text-6xl mb-4">📷</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					No photos found
				</h3>
				<p className="text-gray-500">
					Try adjusting your filters or check back later.
				</p>
			</div>
		);
	}

	if (layout === "masonry") {
		return (
			<div className={cn("flex", gapClasses[gap], className)}>
				{photoColumns.map((columnPhotos, columnIndex) => (
					<div
						key={`col-${
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							columnIndex
						}`}
						className={cn("flex-1 space-y-4")}
					>
						{columnPhotos.map((photo, index) => {
							const photoIndex = photos.findIndex((p) => p.id === photo.id);
							return (
								<div
									key={photo.id}
									className="break-inside-avoid relative group"
								>
									<LazyImage
										src={`/api/photos/serve/${encodeURIComponent(photo.filePath)}`}
										alt={photo.title}
										aspectRatio="auto"
										onClick={() => onPhotoClick?.(photo, photoIndex)}
										onLoad={handlePhotoLoad}
										className="rounded-lg shadow-sm hover:shadow-md transition-shadow"
									/>
									{/* Vote Count Overlay */}
									{photo.voteCount !== undefined && (
										<div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
											<Heart
												className={cn(
													"h-4 w-4",
													photo.hasVoted
														? "fill-red-500 text-red-500"
														: "text-gray-600",
												)}
											/>
											<span className="text-sm font-medium text-gray-900">
												{photo.voteCount}
											</span>
										</div>
									)}
									{showMetadata && (
										<div className="mt-2 space-y-1">
											<h4 className="font-medium text-sm line-clamp-1">
												{photo.title}
											</h4>
											{photo.user && (
												<p className="text-xs text-gray-600">
													by {photo.user.name}
												</p>
											)}
											{photo.category && (
												<p className="text-xs text-gray-500">
													{photo.category.name}
												</p>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				))}
			</div>
		);
	}

	return (
		<div
			className={cn("grid", columnClasses[columns], gapClasses[gap], className)}
		>
			{photos.map((photo, index) => (
				<div key={photo.id} className="group relative">
					<LazyImage
						src={`/api/photos/serve/${encodeURIComponent(photo.filePath)}`}
						alt={photo.title}
						aspectRatio={aspectRatio}
						onClick={() => onPhotoClick?.(photo, index)}
						onLoad={handlePhotoLoad}
						className="rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-[1.02]"
					/>
					{/* Vote Count Overlay */}
					{photo.voteCount !== undefined && (
						<div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
							<Heart
								className={cn(
									"h-4 w-4",
									photo.hasVoted
										? "fill-red-500 text-red-500"
										: "text-gray-600",
								)}
							/>
							<span className="text-sm font-medium text-gray-900">
								{photo.voteCount}
							</span>
						</div>
					)}
					{showMetadata && (
						<div className="mt-3 space-y-1">
							<h4 className="font-medium text-sm line-clamp-1">
								{photo.title}
							</h4>
							{photo.user && (
								<p className="text-xs text-gray-600">by {photo.user.name}</p>
							)}
							{photo.category && (
								<p className="text-xs text-gray-500">{photo.category.name}</p>
							)}
							{photo.location && (
								<p className="text-xs text-gray-400">📍 {photo.location}</p>
							)}
						</div>
					)}
				</div>
			))}
		</div>
	);
}
