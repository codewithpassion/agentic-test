/**
 * Public Homepage with Featured Competitions and Photo Galleries
 */

import { ArrowRight, Camera } from "lucide-react";
import { useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link } from "react-router";
import { PhotoGrid } from "~/components/gallery/photo-grid";
import { PhotoLightbox } from "~/components/gallery/photo-lightbox";
import { trpc } from "~/lib/trpc";
import type { PhotoWithRelations } from "../../api/database/schema";

export const meta: MetaFunction = () => {
	return [
		{ title: "2025 Wildlife Photo Contest - Discover Amazing Photography" },
		{
			name: "description",
			content:
				"Welcome to the Wildlife Photo Contest, part of the 73rd annual international conference of the Wildlife Disease Association. Showcase wildlife captures and explore photos as stories.",
		},
		{ property: "og:title", content: "2025 Wildlife Photo Contest" },
		{
			property: "og:description",
			content:
				"Wildlife Photo Contest - Categories including Landscapes/Flora, Wildlife Captive, and Wildlife Free ranging",
		},
		{ property: "og:type", content: "website" },
	];
};

export async function loader(args: LoaderFunctionArgs) {
	// Public homepage - no authentication required
	return {};
}

export default function HomePage() {
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);

	// Fetch active competitions
	const { data: competitions = [], isLoading: competitionsLoading } =
		trpc.competitions.list.useQuery({
			status: "active",
			limit: 6,
		});

	// Get the first active competition
	const activeCompetition = competitions[0];

	// Get categories for the active competition
	const { data: categories = [] } = trpc.categories.listByCompetition.useQuery(
		{ competitionId: activeCompetition?.id || "" },
		{ enabled: !!activeCompetition?.id },
	);

	// Fetch photos from active competition for both category backgrounds and recent submissions
	const { data: photosData, isLoading: photosLoading } =
		trpc.photos.getByCompetition.useQuery(
			{
				competitionId: activeCompetition?.id || "",
				limit: 50, // Get enough photos for both purposes
				status: "approved",
			},
			{ enabled: !!activeCompetition?.id },
		);

	const allPhotos = photosData?.photos || [];
	const recentPhotos = allPhotos.slice(0, 12); // First 12 for recent submissions

	// Create a map of category ID to first photo
	const categoryPhotos = categories.reduce(
		(acc, category) => {
			const firstPhoto = allPhotos.find(
				(photo) => photo.categoryId === category.id,
			);
			acc[category.id] = firstPhoto;
			return acc;
		},
		{} as Record<string, PhotoWithRelations | undefined>,
	);

	// Handle photo click for lightbox
	const handlePhotoClick = (photo: PhotoWithRelations, index: number) => {
		setLightboxIndex(index);
		setLightboxOpen(true);
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Navigation */}
			<nav className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-8">
							<div className="text-xl font-bold text-gray-900">
								2025 Wildlife Photo Contest
							</div>
							<div className="hidden md:flex space-x-6 text-sm">
								<Link to="/" className="text-gray-900 hover:text-gray-600">
									Home
								</Link>
								<a href="#about" className="text-gray-900 hover:text-gray-600">
									About
								</a>
								{categories.map((category) => (
									<Link
										key={category.id}
										to={
											activeCompetition
												? `/competitions/${activeCompetition.id}/categories/${category.id}`
												: "#"
										}
										className="text-gray-900 hover:text-gray-600"
									>
										{category.name}
									</Link>
								))}
								<a
									href="#contact"
									className="text-gray-900 hover:text-gray-600"
								>
									Contact
								</a>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<div className="hidden sm:flex items-center space-x-2 text-gray-600">
								<span>📧</span>
								<span>🐦</span>
								<span>📷</span>
							</div>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<div className="relative bg-white py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
						Wildlife Photo Contest
						<br />
						<span className="text-gray-700">Categories</span>
					</h1>
					<p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
						Welcome to the Wildlife Photo Contest, an event as part of the 73rd
						annual international conference of the Wildlife Disease Association.
						This is a platform to showcase the wildlife captures participating
						in the contest for recognition and prizes. Join us and explore the
						photos as stories behind them. Click here to start exploring.
					</p>
				</div>
			</div>

			{/* Category Cards Section */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				{categories.length > 0 ? (
					<div
						className={`grid grid-cols-1 gap-8 ${
							categories.length === 1
								? "md:grid-cols-1 max-w-md mx-auto"
								: categories.length === 2
									? "md:grid-cols-2"
									: "md:grid-cols-3"
						}`}
					>
						{categories.map((category) => {
							const firstPhoto = categoryPhotos[category.id];
							const backgroundImage = firstPhoto
								? `/api/photos/serve/${encodeURIComponent(firstPhoto.filePath)}`
								: "https://placehold.co/400x300/e5e7eb/9ca3af?text=No+Photos";

							return (
								<Link
									key={category.id}
									to={
										activeCompetition
											? `/competitions/${activeCompetition.id}/categories/${category.id}`
											: "#"
									}
									className="group cursor-pointer block"
								>
									<div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
										<div className="aspect-[4/3] relative bg-gray-200">
											<img
												src={backgroundImage}
												alt={category.name}
												className="w-full h-full object-cover"
												onLoad={(e) => {
													e.currentTarget.style.opacity = "1";
												}}
												onError={(e) => {
													console.log("Image failed to load:", backgroundImage);
													e.currentTarget.src =
														"https://placehold.co/400x300/e5e7eb/9ca3af?text=No+Photos";
												}}
												style={{ opacity: 0, transition: "opacity 0.3s" }}
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
											<div className="absolute bottom-4 left-4 right-4 z-10">
												<h3 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">
													{category.name}
												</h3>
												<p className="text-white text-sm opacity-90 drop-shadow-md">
													Explore {category.name.toLowerCase()} photography
												</p>
											</div>
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				) : (
					/* Fallback to static cards if no categories or competition */
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<Link
							to={
								activeCompetition
									? `/competitions/${activeCompetition.id}/gallery`
									: "#"
							}
							className="group cursor-pointer block"
						>
							<div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
								<div className="aspect-[4/3] relative bg-gray-200">
									<img
										src="https://placehold.co/400x300/e5e7eb/9ca3af?text=Photo+Contest"
										alt="Contest"
										className="w-full h-full object-cover"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
									<div className="absolute bottom-4 left-4 right-4 z-10">
										<h3 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">
											Photo Contest
										</h3>
										<p className="text-white text-sm opacity-90 drop-shadow-md">
											Explore amazing photography
										</p>
									</div>
								</div>
							</div>
						</Link>
					</div>
				)}
			</div>

			{/* Featured Gallery Section */}
			{recentPhotos.length > 0 && (
				<div className="bg-gray-50 py-16">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-12">
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
								Recent Submissions
							</h2>
							<p className="text-lg text-gray-600 max-w-2xl mx-auto">
								Discover the latest approved submissions from our current
								competition. Click any photo to view it in full detail.
							</p>
						</div>

						{photosLoading ? (
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{Array.from({ length: 6 }).map((_, i) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										key={i}
										className="animate-pulse bg-gray-200 rounded-lg aspect-square"
									/>
								))}
							</div>
						) : (
							<>
								<PhotoGrid
									photos={recentPhotos}
									layout="grid"
									showMetadata={true}
									onPhotoClick={handlePhotoClick}
									columns={3}
									aspectRatio="square"
									gap="md"
									className="mb-8"
								/>
								{activeCompetition && (
									<div className="text-center">
										<Link
											to={`/competitions/${activeCompetition.id}/gallery`}
											className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors color-white"
										>
											<span className="text-white">View All Photos</span>
											<ArrowRight className="h-4 w-4" />
										</Link>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			)}

			{/* Call to Action Section */}
			<div className="bg-gray-800 py-16">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Get Ready to Capture the Wild Beauty
					</h2>
					<p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
						Join us for the exciting wildlife photo contest as part of the 73rd
						annual international conference of the Wildlife Disease Association.
						It's your chance to showcase your talent and passion for wildlife
						photography. Share your unique perspective and connect with fellow
						enthusiasts for photography.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							to="/signup"
							className="inline-flex items-center justify-center px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
						>
							Register Now
						</Link>
						<Link
							to="/login"
							className="inline-flex items-center justify-center px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
						>
							Vote Now
						</Link>
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className="bg-white border-t border-gray-200 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center text-sm text-gray-500">
						© 2025 WDA Wildlife Photo Contest. All rights reserved.
					</div>
				</div>
			</footer>

			{/* Lightbox */}
			{recentPhotos.length > 0 && (
				<PhotoLightbox
					photos={recentPhotos}
					currentIndex={lightboxIndex}
					isOpen={lightboxOpen}
					onClose={() => setLightboxOpen(false)}
					onNavigate={setLightboxIndex}
				/>
			)}
		</div>
	);
}
