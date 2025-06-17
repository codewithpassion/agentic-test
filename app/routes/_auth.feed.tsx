import { ArrowRight, Camera } from "lucide-react";
import { useState } from "react";
import { useRouteLoaderData } from "react-router";
import { Link } from "react-router";
import { GalleryFilters } from "~/components/gallery/gallery-filters";
import { PhotoGrid } from "~/components/gallery/photo-grid";
import { PhotoLightbox } from "~/components/gallery/photo-lightbox";
import { trpc } from "~/lib/trpc";
import type { PhotoWithRelations } from "../../api/database/schema";
import { AppLayout } from "../components/app-layout";

const FeedPage = () => {
	const { user } = useRouteLoaderData("root");
	const [selectedCategory, setSelectedCategory] = useState<string>();
	const [layout, setLayout] = useState<"grid" | "masonry">("grid");
	const [sortBy, setSortBy] = useState<
		"newest" | "oldest" | "title" | "location"
	>("newest");
	const [showMetadata, setShowMetadata] = useState(false);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	// Get active competition
	const { data: activeCompetition } = trpc.competitions.getActive.useQuery();

	// Get categories for the active competition
	const { data: categories = [] } = trpc.categories.listByCompetition.useQuery(
		{ competitionId: activeCompetition?.id || "" },
		{ enabled: !!activeCompetition?.id },
	);

	// Get photos from active competition
	const { data: photosData, isLoading: photosLoading } =
		trpc.photos.getByCompetition.useQuery(
			{
				competitionId: activeCompetition?.id || "",
				categoryId: selectedCategory,
				limit: 50,
				status: "approved",
			},
			{ enabled: !!activeCompetition?.id },
		);

	const allPhotos = photosData?.photos || [];

	const handlePhotoClick = (photo: PhotoWithRelations, index: number) => {
		setLightboxIndex(index);
		setLightboxOpen(true);
	};

	const handleLightboxNavigate = (index: number) => {
		setLightboxIndex(index);
	};

	if (!activeCompetition) {
		return (
			<AppLayout heading="Photo Gallery">
				<div className="text-center py-16">
					<Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
					<h3 className="text-xl font-medium text-gray-900 mb-2">
						No Active Competition
					</h3>
					<p className="text-gray-600 mb-6">
						There are currently no active photo competitions. Check back later!
					</p>
				</div>
			</AppLayout>
		);
	}

	return (
		<AppLayout heading="Photo Gallery" subHeading={activeCompetition.title}>
			<div className="space-y-6">
				{/* Category Navigation */}
				<div className="bg-white rounded-lg p-6 shadow-sm">
					<div className="mb-4">
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							Categories
						</h3>
						<p className="text-sm text-gray-600">
							Browse photos by category or view all submissions
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setSelectedCategory(undefined)}
							className={`px-4 py-2 rounded-full border transition-colors ${
								!selectedCategory
									? "bg-black text-white border-black"
									: "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
							}`}
						>
							All Categories
						</button>
						{categories.map((category) => (
							<button
								type="button"
								key={category.id}
								onClick={() => setSelectedCategory(category.id)}
								className={`px-4 py-2 rounded-full border transition-colors ${
									selectedCategory === category.id
										? "bg-black text-white border-black"
										: "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
								}`}
							>
								{category.name}
							</button>
						))}
					</div>
				</div>

				{/* Gallery Filters */}
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
					photoCount={allPhotos.length}
				/>

				{/* Photo Grid */}
				<div className="bg-white rounded-lg p-6 shadow-sm">
					<PhotoGrid
						photos={allPhotos}
						columns={3}
						layout={layout}
						aspectRatio="auto"
						gap="md"
						showMetadata={showMetadata}
						onPhotoClick={handlePhotoClick}
						loading={photosLoading}
					/>

					{/* Empty State */}
					{!photosLoading && allPhotos.length === 0 && (
						<div className="text-center py-16">
							<div className="text-6xl mb-4">📷</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">
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
								<button
									type="button"
									onClick={() => setSelectedCategory(undefined)}
									className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
								>
									View All Categories
								</button>
							)}
						</div>
					)}
				</div>

				{/* Call to Action */}
				{allPhotos.length > 0 && (
					<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 text-center">
						<h3 className="text-xl font-medium text-gray-900 mb-2">
							Ready to share your own photos?
						</h3>
						<p className="text-gray-600 mb-6">
							Join the competition and submit your best wildlife photography.
						</p>
						<Link to="/submit">
							<button
								type="button"
								className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								<Camera className="w-5 h-5 mr-2" />
								Submit Photos
								<ArrowRight className="w-4 h-4 ml-2" />
							</button>
						</Link>
					</div>
				)}
			</div>

			{/* Lightbox */}
			{allPhotos.length > 0 && (
				<PhotoLightbox
					photos={allPhotos}
					currentIndex={lightboxIndex}
					isOpen={lightboxOpen}
					onClose={() => setLightboxOpen(false)}
					onNavigate={handleLightboxNavigate}
				/>
			)}
		</AppLayout>
	);
};

export default FeedPage;
