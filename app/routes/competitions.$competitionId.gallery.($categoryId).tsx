import { Camera } from "lucide-react";
import { useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, useLoaderData, useNavigate } from "react-router";
import { toast } from "sonner";
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
	categoryId?: string;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) return [{ title: "Gallery Not Found" }];

	const title = "Photo Gallery - Wildlife Photo Contest";
	const description = "Browse amazing wildlife photography submissions.";

	return [
		{ title },
		{ name: "description", content: description },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:type", content: "website" },
	];
};

export async function loader({ params }: LoaderFunctionArgs) {
	const { competitionId, categoryId } = params;
	if (!competitionId) {
		throw new Response("Competition ID required", { status: 400 });
	}

	return { competitionId, categoryId };
}

export default function CompetitionGallery() {
	const { competitionId, categoryId } = useLoaderData<LoaderData>();
	const { user } = useAuth();
	const navigate = useNavigate();
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
		categoryId,
	);
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

	// Get categories for this competition
	const { data: categories = [], isLoading: categoriesLoading } =
		trpc.categories.listByCompetition.useQuery({
			competitionId,
		});

	// Get category details if categoryId is provided
	const { data: category, isLoading: categoryLoading } =
		trpc.categories.getById.useQuery(
			{ id: categoryId || "" },
			{ enabled: !!categoryId },
		);

	// Get photos based on whether we have a specific category or not
	const { data: photosData, isLoading: photosLoading } = categoryId
		? trpc.photos.getByCategory.useQuery({
				categoryId,
				limit: 100,
				offset: 0,
				status: "approved",
			})
		: trpc.photos.getByCompetition.useQuery({
				competitionId,
				categoryId: selectedCategory,
				limit: 100,
				offset: 0,
				status: "approved",
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

	// Get tRPC utils for query invalidation
	const utils = trpc.useContext();

	// Voting mutations with optimistic updates
	const voteMutation = trpc.votes.vote.useMutation({
		onMutate: async ({ photoId }) => {
			// Cancel any outgoing refetches
			await utils.votes.getVoteCounts.cancel({ photoIds });

			// Snapshot the previous value
			const previousData = utils.votes.getVoteCounts.getData({ photoIds });

			// Optimistically update
			if (previousData) {
				utils.votes.getVoteCounts.setData(
					{ photoIds },
					{
						voteCounts: {
							...previousData.voteCounts,
							[photoId]: (previousData.voteCounts[photoId] || 0) + 1,
						},
						userVotes: [...previousData.userVotes, photoId],
					},
				);
			}

			return { previousData };
		},
		onError: (err, _, context) => {
			// Rollback on error
			if (context?.previousData) {
				utils.votes.getVoteCounts.setData({ photoIds }, context.previousData);
			}

			if (err.message.includes("already voted")) {
				toast.error("You've already voted in this category");
			} else if (err.message.includes("UNAUTHORIZED")) {
				toast.error("Please login to vote");
			} else {
				toast.error("Failed to vote. Please try again.");
			}
		},
		onSuccess: () => {
			toast.success("Vote recorded!");
		},
		onSettled: () => {
			// Always refetch after error or success
			utils.votes.getVoteCounts.invalidate({ photoIds });
		},
	});

	const unvoteMutation = trpc.votes.unvote.useMutation({
		onMutate: async ({ photoId }) => {
			// Cancel any outgoing refetches
			await utils.votes.getVoteCounts.cancel({ photoIds });

			// Snapshot the previous value
			const previousData = utils.votes.getVoteCounts.getData({ photoIds });

			// Optimistically update
			if (previousData) {
				utils.votes.getVoteCounts.setData(
					{ photoIds },
					{
						voteCounts: {
							...previousData.voteCounts,
							[photoId]: Math.max(
								0,
								(previousData.voteCounts[photoId] || 0) - 1,
							),
						},
						userVotes: previousData.userVotes.filter((id) => id !== photoId),
					},
				);
			}

			return { previousData };
		},
		onError: (err, _, context) => {
			// Rollback on error
			if (context?.previousData) {
				utils.votes.getVoteCounts.setData({ photoIds }, context.previousData);
			}
			toast.error("Failed to remove vote. Please try again.");
		},
		onSuccess: () => {
			toast.success("Vote removed!");
		},
		onSettled: () => {
			// Always refetch after error or success
			utils.votes.getVoteCounts.invalidate({ photoIds });
		},
	});

	const handleVoteClick = (
		photo: PhotoWithRelations & { hasVoted?: boolean },
	) => {
		if (!user) {
			toast.info("Please login to vote");
			navigate("/login");
			return;
		}

		if (photo.hasVoted) {
			unvoteMutation.mutate({ photoId: photo.id });
		} else {
			voteMutation.mutate({ photoId: photo.id });
		}
	};

	const isLoading =
		competitionLoading ||
		categoriesLoading ||
		photosLoading ||
		(categoryId ? categoryLoading : false);

	if (competitionLoading || (categoryId && categoryLoading)) {
		return (
			<PublicLayout>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="animate-pulse space-y-4">
						<div className="h-8 bg-gray-200 rounded w-1/3" />
						<div className="h-4 bg-gray-200 rounded w-2/3" />
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<div key={i} className="aspect-[4/3] bg-gray-200 rounded" />
							))}
						</div>
					</div>
				</div>
			</PublicLayout>
		);
	}

	if (!competition || (categoryId && !category)) {
		return null; // Let React Router handle 404
	}

	// Sort photos based on sortBy
	const sortedPhotos = [...photosWithVotes].sort((a, b) => {
		switch (sortBy) {
			case "oldest":
				return (
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
			case "title":
				return (a.title || "").localeCompare(b.title || "");
			case "location":
				return (a.location || "").localeCompare(b.location || "");
			default: // "newest"
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
		}
	});

	return (
		<PublicLayout>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-3xl font-bold text-gray-900">
							{categoryId && category ? category.name : "Photo Gallery"}
						</h1>
						{competition.status === "active" && (
							<Link to={user ? `/submit/${competitionId}` : "/login"}>
								<Button>
									<Camera className="w-4 h-4 mr-2" />
									Submit Photo
								</Button>
							</Link>
						)}
					</div>

					{/* Category pills */}
					{!categoriesLoading && categories.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-6">
							<Link
								to={`/competitions/${competitionId}/gallery`}
								className={cn(
									"px-4 py-2 rounded-full text-sm transition-colors",
									!categoryId && !selectedCategory
										? "bg-gray-900 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200",
								)}
							>
								All Photos
							</Link>
							{categories.map((cat) => (
								<Link
									key={cat.id}
									to={`/competitions/${competitionId}/gallery/${cat.id}`}
									className={cn(
										"px-4 py-2 rounded-full text-sm transition-colors",
										cat.id === categoryId ||
											(!categoryId && cat.id === selectedCategory)
											? "bg-gray-900 text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200",
									)}
								>
									{cat.name}
								</Link>
							))}
						</div>
					)}

					{/* Filters */}
					<GalleryFilters
						categories={[]} // Hide category dropdown since we use pills
						selectedCategory={undefined}
						onCategoryChange={() => {}}
						layout={layout}
						onLayoutChange={setLayout}
						sortBy={sortBy}
						onSortChange={setSortBy}
						showMetadata={showMetadata}
						onMetadataToggle={setShowMetadata}
						photoCount={photos.length}
						compact
					/>
				</div>

				{/* Photo Grid */}
				<PhotoGrid
					photos={sortedPhotos}
					columns={3}
					layout={layout}
					aspectRatio="auto"
					gap="md"
					showMetadata={showMetadata}
					onPhotoClick={handlePhotoClick}
					onVoteClick={handleVoteClick}
					loading={isLoading}
					className="mb-12"
				/>

				{/* Empty State */}
				{!isLoading && photos.length === 0 && (
					<div className="text-center py-16">
						<Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<h3 className="text-xl font-medium text-gray-900 mb-2">
							No photos yet
						</h3>
						<p className="text-gray-500 mb-6">
							Be the first to submit a photo to this{" "}
							{categoryId && category ? "category" : "gallery"}.
						</p>
						{competition.status === "active" && (
							<Link to={user ? `/submit/${competitionId}` : "/login"}>
								<Button>
									<Camera className="w-4 h-4 mr-2" />
									Submit Your Photo
								</Button>
							</Link>
						)}
					</div>
				)}

				{/* Call to Action */}
				{!isLoading && photos.length > 0 && competition.status === "active" && (
					<SubmitPhotoCTA competitionId={competitionId} className="mt-12" />
				)}
			</div>

			{/* Lightbox */}
			{sortedPhotos.length > 0 && (
				<PhotoLightbox
					photos={sortedPhotos}
					currentIndex={lightboxIndex}
					isOpen={lightboxOpen}
					onClose={() => setLightboxOpen(false)}
					onNavigate={handleLightboxNavigate}
				/>
			)}
		</PublicLayout>
	);
}
