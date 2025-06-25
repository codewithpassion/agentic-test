import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import { GalleryFilters } from "~/components/gallery/gallery-filters";
import { PhotoGrid } from "~/components/gallery/photo-grid";
import { PhotoLightbox } from "~/components/gallery/photo-lightbox";
import { PublicLayout } from "~/components/public-layout";
import { Button } from "~/components/ui/button";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";
import type { PhotoWithRelations } from "../../api/database/schema";

interface LoaderData {
	competitionId: string;
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	if (!data) {
		return [{ title: "Competition Not Found" }];
	}

	return [
		{ title: "Photo Gallery - Competition" },
		{
			name: "description",
			content:
				"Browse and discover amazing photography submissions in this competition.",
		},
		{ property: "og:title", content: "Photo Gallery - Competition" },
		{
			property: "og:description",
			content:
				"Browse and discover amazing photography submissions in this competition.",
		},
		{ property: "og:type", content: "website" },
	];
};

export async function loader({ params }: LoaderFunctionArgs) {
	const competitionId = params.competitionId;
	if (!competitionId) {
		throw new Response("Competition ID required", { status: 400 });
	}

	return { competitionId };
}

export default function CompetitionGallery() {
	const { competitionId } = useLoaderData<LoaderData>();
	const [selectedCategory, setSelectedCategory] = useState<string>();
	const [layout, setLayout] = useState<"grid" | "masonry">("grid");
	const [sortBy, setSortBy] = useState<
		"newest" | "oldest" | "title" | "location"
	>("newest");
	const [showMetadata, setShowMetadata] = useState(false);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	// Get competition details
	const { data: competition, isLoading: competitionLoading } =
		trpc.competitions.getById.useQuery({
			id: competitionId,
		});

	// Get categories for this competition
	const { data: categories = [], isLoading: categoriesLoading } =
		trpc.categories.listByCompetition.useQuery({
			competitionId,
		});

	// Get photos for the selected category or all photos for the competition
	const { data: photosData, isLoading: photosLoading } =
		trpc.photos.getByCompetition.useQuery({
			competitionId,
			categoryId: selectedCategory,
			limit: 100,
			offset: 0,
			status: "approved", // Only show approved photos
		});

	const photos = photosData?.photos || [];

	const handlePhotoClick = (photo: PhotoWithRelations, index: number) => {
		setLightboxIndex(index);
		setLightboxOpen(true);
	};

	const handleLightboxNavigate = (index: number) => {
		setLightboxIndex(index);
	};

	const isLoading = competitionLoading || categoriesLoading || photosLoading;

	if (competitionLoading) {
		return (
			<PublicLayout>
				<div className="p-8">
					<div className="max-w-7xl mx-auto">
						<div className="animate-pulse">
							<div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
							<div className="h-12 bg-gray-200 rounded w-2/3 mb-8" />
						</div>
					</div>
				</div>
			</PublicLayout>
		);
	}

	if (!competition) {
		return (
			<PublicLayout>
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Competition Not Found
						</h1>
						<p className="text-gray-600 mb-4">
							The competition you're looking for doesn't exist or isn't public.
						</p>
						<Link to="/">
							<Button>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Go Home
							</Button>
						</Link>
					</div>
				</div>
			</PublicLayout>
		);
	}

	return (
		<PublicLayout>
			{/* Header */}
			<div className="bg-white border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="space-y-4">
						<h1 className="text-3xl font-bold text-gray-900">
							{competition.title}
						</h1>
						{competition.description && (
							<p className="text-lg text-gray-600 max-w-3xl">
								{competition.description}
							</p>
						)}

						{/* Competition Stats */}
						<div className="flex flex-wrap gap-6 text-sm text-gray-500">
							{competition.startDate && (
								<div>
									<span className="font-medium">Started:</span>{" "}
									{new Date(competition.startDate).toLocaleDateString()}
								</div>
							)}
							{competition.endDate && (
								<div>
									<span className="font-medium">Ends:</span>{" "}
									{new Date(competition.endDate).toLocaleDateString()}
								</div>
							)}
							<div>
								<span className="font-medium">Status:</span>{" "}
								<span
									className={cn(
										"capitalize px-2 py-1 rounded-full text-xs",
										competition.status === "active"
											? "bg-green-100 text-green-800"
											: "bg-gray-100 text-gray-800",
									)}
								>
									{competition.status}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Gallery Content */}
			<div className="bg-gray-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{/* Filters */}
					<div className="mb-8">
						<GalleryFilters
							categories={categories}
							selectedCategory={selectedCategory}
							onCategoryChange={setSelectedCategory}
							layout={layout}
							onLayoutChange={setLayout}
							sortBy={sortBy}
							onSortChange={setSortBy}
							showMetadata={showMetadata}
							onMetadataToggle={setShowMetadata}
							photoCount={photos.length}
						/>
					</div>

					{/* Photo Grid */}
					<PhotoGrid
						photos={photos}
						columns={layout === "grid" ? 3 : 3}
						layout={layout}
						aspectRatio="auto"
						gap="md"
						showMetadata={showMetadata}
						onPhotoClick={handlePhotoClick}
						loading={isLoading}
						className="mb-12"
					/>

					{/* Empty State */}
					{!isLoading && photos.length === 0 && (
						<div className="text-center py-16">
							<div className="text-6xl mb-4">📷</div>
							<h3 className="text-xl font-medium text-gray-900 mb-2">
								{selectedCategory
									? "No photos in this category"
									: "No photos yet"}
							</h3>
							<p className="text-gray-500 mb-6">
								{selectedCategory
									? "Try selecting a different category or check back later."
									: "Photos will appear here once they're submitted and approved."}
							</p>
							{selectedCategory && (
								<Button
									variant="outline"
									onClick={() => setSelectedCategory(undefined)}
								>
									View All Categories
								</Button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Lightbox */}
			{photos.length > 0 && (
				<PhotoLightbox
					photos={photos}
					currentIndex={lightboxIndex}
					isOpen={lightboxOpen}
					onClose={() => setLightboxOpen(false)}
					onNavigate={handleLightboxNavigate}
				/>
			)}
		</PublicLayout>
	);
}
