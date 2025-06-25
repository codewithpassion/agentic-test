import { ArrowLeft, Camera } from "lucide-react";
import { useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import { GalleryFilters } from "~/components/gallery/gallery-filters";
import { PhotoGrid } from "~/components/gallery/photo-grid";
import { PhotoLightbox } from "~/components/gallery/photo-lightbox";
import { PublicLayout } from "~/components/public-layout";
import { Button } from "~/components/ui/button";
import { SubmitPhotoCTA } from "~/components/ui/submit-photo-cta";
import { useAuth } from "~/hooks/use-auth";
import { useVoteCounts } from "~/hooks/use-votes";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";
import type { PhotoWithRelations } from "../../api/database/schema";

interface LoaderData {
	competitionId: string;
	categoryId: string;
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	if (!data) {
		return [{ title: "Category Not Found" }];
	}

	return [
		{ title: "Category Gallery" },
		{
			name: "description",
			content: "Browse amazing photography submissions in this category.",
		},
		{ property: "og:title", content: "Category Gallery" },
		{
			property: "og:description",
			content: "Browse amazing photography submissions in this category.",
		},
		{ property: "og:type", content: "website" },
	];
};

export async function loader({ params }: LoaderFunctionArgs) {
	const { competitionId, categoryId } = params;
	if (!competitionId || !categoryId) {
		throw new Response("Competition ID and Category ID required", {
			status: 400,
		});
	}

	return { competitionId, categoryId };
}

export default function CategoryGallery() {
	const { competitionId, categoryId } = useLoaderData<LoaderData>();
	const { user } = useAuth();
	const [layout, setLayout] = useState<"grid" | "masonry">("masonry");
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

	// Get category details
	const { data: category, isLoading: categoryLoading } =
		trpc.categories.getById.useQuery({
			id: categoryId,
		});

	// Get all categories for navigation
	const { data: allCategories = [], isLoading: categoriesLoading } =
		trpc.categories.listByCompetition.useQuery({
			competitionId,
		});

	// Get photos for this specific category
	const { data: photosData, isLoading: photosLoading } =
		trpc.photos.getByCategory.useQuery({
			categoryId,
			limit: 100,
			offset: 0,
			status: "approved", // Only show approved photos
		});

	const photos = photosData?.photos || [];

	// Get vote counts for all photos
	const photoIds = photos.map((p) => p.id);
	const { data: voteData } = useVoteCounts(photoIds);

	// Enhance photos with vote data
	const photosWithVotes = photos.map((photo) => ({
		...photo,
		voteCount: voteData?.voteCounts[photo.id] || 0,
		hasVoted: voteData?.userVotes.includes(photo.id) || false,
	}));

	const handlePhotoClick = (photo: PhotoWithRelations, index: number) => {
		setLightboxIndex(index);
		setLightboxOpen(true);
	};

	const handleLightboxNavigate = (index: number) => {
		setLightboxIndex(index);
	};

	const isLoading = competitionLoading || categoryLoading || photosLoading;

	if (competitionLoading || categoryLoading) {
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

	if (!competition || !category) {
		return (
			<PublicLayout>
				<div className="flex items-center justify-center min-h-[60vh]">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Category Not Found
						</h1>
						<p className="text-gray-600 mb-4">
							The category you're looking for doesn't exist or isn't public.
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
			{/* Category Navigation */}
			{!categoriesLoading && allCategories.length > 1 && (
				<div className="bg-white border-b">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
						<div className="flex flex-wrap gap-2">
							{allCategories.map((cat) => (
								<Link
									key={cat.id}
									to={`/competitions/${competitionId}/categories/${cat.id}`}
									className={cn(
										"px-4 py-2 rounded-full border transition-colors text-sm",
										cat.id === categoryId
											? "bg-black text-white border-black"
											: "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50",
									)}
								>
									{cat.name}
								</Link>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="bg-white border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<Camera className="w-8 h-8 text-gray-400" />
							<div>
								<h1 className="text-3xl font-bold text-gray-900">
									{category.name}
								</h1>
								<p className="text-lg text-gray-600">
									from {competition.title}
								</p>
							</div>
						</div>

						{/* Category Stats */}
						<div className="flex flex-wrap gap-6 text-sm text-gray-500">
							<div>
								<span className="font-medium">Photos:</span> {photos.length}
							</div>
							<div>
								<span className="font-medium">Max per user:</span>{" "}
								{category.maxPhotosPerUser}
							</div>
							<div>
								<span className="font-medium">Competition:</span>{" "}
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
							categories={[]} // Hide category filters since we're already in a specific category
							selectedCategory={categoryId}
							onCategoryChange={() => {}} // No-op since category is fixed
							layout={layout}
							onLayoutChange={setLayout}
							sortBy={sortBy}
							onSortChange={setSortBy}
							showMetadata={showMetadata}
							onMetadataToggle={setShowMetadata}
							photoCount={photos.length}
							compact={true} // Use compact version
						/>
					</div>

					{/* Photo Grid */}
					<PhotoGrid
						photos={photosWithVotes}
						columns={3}
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
								No photos in {category.name} yet
							</h3>
							<p className="text-gray-500 mb-6">
								Photos will appear here once they're submitted and approved for
								this category.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link to={`/competitions/${competitionId}/gallery`}>
									<Button variant="outline">View All Categories</Button>
								</Link>
								{competition.status === "active" && (
									<Link to={user ? `/submit/${competitionId}` : "/login"}>
										<Button>Submit Your Photo</Button>
									</Link>
								)}
							</div>
						</div>
					)}

					{/* Call to Action */}
					{!isLoading &&
						photos.length > 0 &&
						competition.status === "active" && (
							<SubmitPhotoCTA
								competitionId={competitionId}
								categoryName={category.name}
								title="Inspired by what you see?"
							/>
						)}
				</div>
			</div>

			{/* Lightbox */}
			{photosWithVotes.length > 0 && (
				<PhotoLightbox
					photos={photosWithVotes}
					currentIndex={lightboxIndex}
					isOpen={lightboxOpen}
					onClose={() => setLightboxOpen(false)}
					onNavigate={handleLightboxNavigate}
				/>
			)}
		</PublicLayout>
	);
}
